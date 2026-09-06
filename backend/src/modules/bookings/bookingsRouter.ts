import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const bookingsRouter = Router();

const TIERS = ["BASIC", "SABJI", "FULL_MEAL"] as const;
const BOOKING_STATUSES = ["PENDING", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
// PENDING -> ACCEPTED is handled by /accept, not /status — see below.
const ADVANCE_ORDER = ["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED"] as const;
const CANCELLABLE_STATUSES = ["PENDING", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"] as const;

function requireCustomer(req: Request, res: Response): string | null {
  if (req.auth?.role !== "CUSTOMER") {
    res.status(403).json({ error: "Customer access required" });
    return null;
  }
  return req.auth.sub;
}

function requireCook(req: Request, res: Response): string | null {
  if (req.auth?.role !== "COOK") {
    res.status(403).json({ error: "Cook access required" });
    return null;
  }
  return req.auth.sub;
}

async function getConfigNumber(key: string, fallback: number): Promise<number> {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// Uses the cook's own rate for the tier if one is set (a specific cook was picked), else the
// catalog base price (auto-assign, or a cook with no offering configured yet for this tier).
async function computePricing(tier: (typeof TIERS)[number], cookId: string | null) {
  const service = await prisma.service.findUniqueOrThrow({ where: { tier } });
  let servicePaise = service.basePricePaise;
  if (cookId) {
    const offering = await prisma.cookServiceOffering.findUnique({ where: { cookId_tier: { cookId, tier } } });
    if (offering) servicePaise = offering.ratePaise;
  }
  const platformFeePercent = await getConfigNumber("platform_fee_percent", 0);
  const gstPercent = await getConfigNumber("gst_percent", 0);
  const platformFeePaise = Math.round((servicePaise * platformFeePercent) / 100);
  // GST is charged on (service + platform fee) — the full taxable value of the visit, not just
  // the cook's cut. Revisit if the business's actual GST treatment differs.
  const taxPaise = Math.round(((servicePaise + platformFeePaise) * gstPercent) / 100);
  const totalPaise = servicePaise + platformFeePaise + taxPaise;
  return { servicePaise, platformFeePaise, taxPaise, totalPaise };
}

// ─── Create ───────────────────────────────────────────────────────────────────────

const createBookingSchema = z
  .object({
    tier: z.enum(TIERS),
    addressId: z.string().min(1),
    startAt: z.string().datetime(),
    durationMinutes: z.number().int().positive().optional(),
    cookId: z.string().min(1).optional(),
    autoAssign: z.boolean().optional(),
    vegOnly: z.boolean().optional(),
    genderPref: z.string().max(30).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((d) => d.cookId || d.autoAssign, { message: "cookId or autoAssign is required" });

// POST /bookings — { tier, addressId, startAt, durationMinutes?, cookId? | autoAssign, ... }.
// Explicit cookId assigns directly; autoAssign with no cookId parks it as PENDING/cookless.
// TODO(product): there's no geo/availability-matching dispatch yet for the autoAssign path — it
// just leaves the booking open for any eligible cook to self-assign via POST /:id/accept. Real
// dispatch would need Cook.baseLat/baseLng/radiusKm + CookAvailability matching + notifying cooks.
bookingsRouter.post("/", requireAuth, async (req, res) => {
  const customerId = requireCustomer(req, res);
  if (!customerId) return;

  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { tier, addressId, startAt, cookId, autoAssign, vegOnly, genderPref, notes } = parsed.data;

  const startDate = new Date(startAt);
  if (startDate.getTime() <= Date.now()) return res.status(400).json({ error: "startAt must be in the future" });

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== customerId) return res.status(400).json({ error: "Invalid address" });

  const service = await prisma.service.findUnique({ where: { tier } });
  if (!service || !service.active) return res.status(400).json({ error: "This service tier isn't available" });
  const durationMinutes = parsed.data.durationMinutes ?? service.minMinutes;
  if (durationMinutes < service.minMinutes || durationMinutes > service.maxMinutes) {
    return res
      .status(400)
      .json({ error: `durationMinutes for ${tier} must be between ${service.minMinutes} and ${service.maxMinutes}` });
  }

  let resolvedCookId: string | null = null;
  if (cookId) {
    const cook = await prisma.cook.findUnique({ where: { id: cookId } });
    if (!cook || cook.status !== "ACTIVE") return res.status(400).json({ error: "Cook is not available" });
    resolvedCookId = cookId;
  }

  const { servicePaise, platformFeePaise, taxPaise, totalPaise } = await computePricing(tier, resolvedCookId);

  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        customerId,
        cookId: resolvedCookId,
        addressId,
        tier,
        startAt: startDate,
        durationMinutes,
        servicePaise,
        platformFeePaise,
        taxPaise,
        totalPaise,
        autoAssign: !!autoAssign,
        vegOnly: !!vegOnly,
        genderPref,
        notes,
      },
    });
    await tx.bookingStatusEvent.create({ data: { bookingId: b.id, status: "PENDING", actor: customerId } });
    return b;
  });
  res.status(201).json(booking);
});

// ─── Cook accept / reject ─────────────────────────────────────────────────────────

// POST /bookings/:id/accept — cook only, only from PENDING. Self-assigns an auto-assign booking,
// or confirms one it was explicitly assigned to.
bookingsRouter.post("/:id/accept", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Not found" });
  if (booking.status !== "PENDING") return res.status(409).json({ error: "Booking is not pending" });
  if (booking.cookId && booking.cookId !== cookId) {
    return res.status(403).json({ error: "This booking is assigned to another cook" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id: booking.id }, data: { cookId, status: "ACCEPTED" } });
    await tx.bookingStatusEvent.create({ data: { bookingId: b.id, status: "ACCEPTED", actor: cookId } });
    return b;
  });
  res.json(updated);
});

// POST /bookings/:id/reject — cook only, only a booking explicitly assigned to them, only from
// PENDING. Frees the booking (cookId -> null) for reassignment; status stays PENDING.
bookingsRouter.post("/:id/reject", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Not found" });
  if (booking.status !== "PENDING") return res.status(409).json({ error: "Booking is not pending" });
  if (booking.cookId !== cookId) return res.status(403).json({ error: "This booking isn't assigned to you" });

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id: booking.id }, data: { cookId: null } });
    await tx.bookingStatusEvent.create({
      data: { bookingId: b.id, status: "PENDING", actor: cookId, note: "Rejected by cook, released for reassignment" },
    });
    return b;
  });
  res.json(updated);
});

// ─── Cook status progression ──────────────────────────────────────────────────────

const advanceStatusSchema = z.object({ status: z.enum(ADVANCE_ORDER) });

// POST /bookings/:id/status — cook only, the assigned cook only. Advances exactly one step along
// ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED — no skipping, no going back.
bookingsRouter.post("/:id/status", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const parsed = advanceStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Not found" });
  if (booking.cookId !== cookId) return res.status(403).json({ error: "Not your booking" });

  const currentIdx = ADVANCE_ORDER.indexOf(booking.status as (typeof ADVANCE_ORDER)[number]);
  const nextIdx = ADVANCE_ORDER.indexOf(parsed.data.status);
  if (currentIdx === -1 || nextIdx !== currentIdx + 1) {
    return res.status(409).json({ error: `Cannot move from ${booking.status} to ${parsed.data.status}` });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status } });
    await tx.bookingStatusEvent.create({ data: { bookingId: b.id, status: parsed.data.status, actor: cookId } });
    return b;
  });
  res.json(updated);
});

// ─── Cancel ───────────────────────────────────────────────────────────────────────

const cancelSchema = z.object({ reason: z.string().max(500).optional() });

// POST /bookings/:id/cancel — either party, only pre-COMPLETED. Applies the cancellation-fee rule
// from AppConfig: free outside the cutoff window before the slot, a flat fee inside it.
bookingsRouter.post("/:id/cancel", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!; // requireAuth already guarantees CUSTOMER or COOK here

  const parsed = cancelSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Not found" });
  const owns = (role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub);
  if (!owns) return res.status(404).json({ error: "Not found" }); // don't reveal existence to non-parties
  if (!CANCELLABLE_STATUSES.includes(booking.status as (typeof CANCELLABLE_STATUSES)[number])) {
    return res.status(409).json({ error: `Cannot cancel a ${booking.status} booking` });
  }

  const cutoffMinutes = await getConfigNumber("cancellation_cutoff_minutes", 120);
  const feePaise = await getConfigNumber("cancellation_fee_paise", 0);
  const minutesUntilStart = (booking.startAt.getTime() - Date.now()) / 60000;
  const cancellationFeePaise = minutesUntilStart < cutoffMinutes ? feePaise : 0;

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledBy: role, cancelReason: parsed.data.reason, cancellationFeePaise },
    });
    await tx.bookingStatusEvent.create({
      data: { bookingId: b.id, status: "CANCELLED", actor: sub, note: parsed.data.reason },
    });
    return b;
  });
  res.json(updated);
});

// ─── Read ─────────────────────────────────────────────────────────────────────────

// GET /bookings — scoped to the caller: a customer sees their own, a cook sees theirs.
bookingsRouter.get("/", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;

  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status !== undefined && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    return res.status(400).json({ error: `status must be one of: ${BOOKING_STATUSES.join(", ")}` });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

  const scope = role === "CUSTOMER" ? { customerId: sub } : { cookId: sub };
  const bookings = await prisma.booking.findMany({
    where: status ? { ...scope, status: status as (typeof BOOKING_STATUSES)[number] } : scope,
    orderBy: { startAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  res.json(bookings);
});

// GET /bookings/available — cook only. The open pool of PENDING, not-yet-assigned bookings any
// ACTIVE cook can self-assign via POST /:id/accept. There's no geo/availability dispatch yet
// (see the create-booking comment) — this is the interim "jobs board" the cook app polls.
bookingsRouter.get("/available", requireAuth, async (req, res) => {
  const cookId = requireCook(req, res);
  if (!cookId) return;

  const cook = await prisma.cook.findUnique({ where: { id: cookId }, select: { status: true } });
  if (!cook || cook.status !== "ACTIVE") return res.json([]); // only ACTIVE cooks can pick up work

  const bookings = await prisma.booking.findMany({
    where: { status: "PENDING", cookId: null },
    orderBy: { startAt: "asc" },
    take: 50,
  });
  res.json(bookings);
});

// GET /bookings/:id — full detail incl. status history, for polling. The owning customer, the
// assigned cook, or (so a cook can look before accepting) any cook viewing a still-open PENDING
// booking. Everyone else gets 404 — don't confirm it exists.
bookingsRouter.get("/:id", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { statusEvents: { orderBy: { createdAt: "asc" } } },
  });
  if (!booking) return res.status(404).json({ error: "Not found" });
  const owns =
    (role === "CUSTOMER" && booking.customerId === sub) ||
    (role === "COOK" && booking.cookId === sub) ||
    (role === "COOK" && booking.cookId === null && booking.status === "PENDING");
  if (!owns) return res.status(404).json({ error: "Not found" });
  res.json(booking);
});
