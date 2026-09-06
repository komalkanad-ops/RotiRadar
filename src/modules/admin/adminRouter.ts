import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminRouter = Router();

// Every route here is admin-gated.
adminRouter.use(requireAdmin);

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (req.auth?.adminRole !== "SUPER_ADMIN") {
    res.status(403).json({ error: "SUPER_ADMIN access required" });
    return false;
  }
  return true;
}

function paging(req: Request) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  return { skip: (page - 1) * pageSize, take: pageSize };
}

const BOOKING_STATUSES = ["PENDING", "ACCEPTED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const CONFIG_KEYS = [
  "cancellation_cutoff_minutes",
  "cancellation_fee_paise",
  "platform_fee_percent",
  "gst_percent",
  "scheduling_horizon_days",
  "default_service_radius_km",
  "cook_commission_percent",
] as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────────

// GET /admin/stats — headline numbers for the console dashboard.
adminRouter.get("/stats", async (_req, res) => {
  const [users, cooksByStatus, bookingsByStatus, paidAgg, pendingDocs] = await Promise.all([
    prisma.user.count(),
    prisma.cook.groupBy({ by: ["status"], _count: true }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.transaction.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true } }),
    prisma.cookDocument.count({ where: { status: "UPLOADED" } }),
  ]);
  res.json({
    users,
    cooks: Object.fromEntries(cooksByStatus.map((c) => [c.status, c._count])),
    bookings: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count])),
    grossPaidPaise: paidAgg._sum.amountPaise ?? 0,
    pendingKycDocuments: pendingDocs,
  });
});

// ─── Customers ────────────────────────────────────────────────────────────────────

// GET /admin/users?q=&page=&pageSize= — customer list; `q` matches phone or name.
adminRouter.get("/users", async (req, res) => {
  const q = typeof req.query.q === "string" && req.query.q.trim() ? req.query.q.trim() : undefined;
  const where = q ? { OR: [{ phone: { contains: q } }, { name: { contains: q } }] } : undefined;
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, ...paging(req) });
  res.json(users);
});

// GET /admin/users/:id — one customer with their addresses and bookings.
adminRouter.get("/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      addresses: true,
      bookings: { orderBy: { startAt: "desc" }, take: 50 },
    },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

// ─── Bookings ─────────────────────────────────────────────────────────────────────

// GET /admin/bookings?status=&page=&pageSize= — every booking, newest slot first.
adminRouter.get("/bookings", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status !== undefined && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    return res.status(400).json({ error: `status must be one of: ${BOOKING_STATUSES.join(", ")}` });
  }
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as (typeof BOOKING_STATUSES)[number] } : undefined,
    orderBy: { startAt: "desc" },
    ...paging(req),
  });
  res.json(bookings);
});

// GET /admin/bookings/:id — full detail: status history + transactions + the two parties.
adminRouter.get("/bookings/:id", async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      statusEvents: { orderBy: { createdAt: "asc" } },
      transactions: { orderBy: { createdAt: "asc" } },
      customer: { select: { id: true, phone: true, name: true, email: true } },
      cook: { select: { id: true, phone: true, name: true, status: true } },
      address: true,
    },
  });
  if (!booking) return res.status(404).json({ error: "Not found" });
  res.json(booking);
});

// GET /admin/bookings/:id/chat — the full message transcript. Admins are allowed to review chats
// (disclosed in the Privacy Policy); this is that surface.
adminRouter.get("/bookings/:id/chat", async (req, res) => {
  const exists = await prisma.booking.count({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ error: "Not found" });
  const messages = await prisma.message.findMany({
    where: { bookingId: req.params.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  res.json(messages);
});

// ─── Config ───────────────────────────────────────────────────────────────────────

// GET /admin/config — all pricing/policy config keys as a flat object.
adminRouter.get("/config", async (_req, res) => {
  const rows = await prisma.appConfig.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

const configSchema = z
  .record(z.string(), z.string().regex(/^\d+$/, "config values must be non-negative integers"))
  .refine((obj) => Object.keys(obj).every((k) => (CONFIG_KEYS as readonly string[]).includes(k)), {
    message: `keys must be among: ${CONFIG_KEYS.join(", ")}`,
  });

// PATCH /admin/config — { <key>: "<int-as-string>", ... } — upserts each allowed key.
adminRouter.patch("/config", async (req, res) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  const rows = await prisma.appConfig.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

// ─── Reports (safety / conduct) ───────────────────────────────────────────────────

const REPORT_STATUSES = ["OPEN", "UNDER_REVIEW", "ACTIONED", "DISMISSED"] as const;

adminRouter.get("/reports", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status !== undefined && !REPORT_STATUSES.includes(status as (typeof REPORT_STATUSES)[number])) {
    return res.status(400).json({ error: `status must be one of: ${REPORT_STATUSES.join(", ")}` });
  }
  // `category` filter: exact match, or the pseudo-value "feedback" for bug reports + suggestions
  // (what the in-app widget files).
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const categoryWhere =
    category === "feedback"
      ? { category: { in: ["bug", "suggestion"] } }
      : category
        ? { category }
        : {};

  const reports = await prisma.report.findMany({
    where: {
      ...(status ? { status: status as (typeof REPORT_STATUSES)[number] } : {}),
      ...categoryWhere,
    },
    orderBy: { createdAt: "desc" },
    ...paging(req),
  });
  res.json(reports);
});

const reviewReportSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  actionTaken: z.string().max(4000).optional(),
});

adminRouter.patch("/reports/:id", async (req, res) => {
  const parsed = reviewReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { ...parsed.data, handledBy: req.auth!.sub },
  });
  res.json(report);
});

// ─── Disputes ─────────────────────────────────────────────────────────────────────

const DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"] as const;

adminRouter.get("/disputes", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status !== undefined && !DISPUTE_STATUSES.includes(status as (typeof DISPUTE_STATUSES)[number])) {
    return res.status(400).json({ error: `status must be one of: ${DISPUTE_STATUSES.join(", ")}` });
  }
  const disputes = await prisma.dispute.findMany({
    where: status ? { status: status as (typeof DISPUTE_STATUSES)[number] } : undefined,
    orderBy: { createdAt: "desc" },
    ...paging(req),
  });
  res.json(disputes);
});

const resolveDisputeSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  resolution: z.string().max(4000).optional(),
  refundPaise: z.number().int().min(0).optional(),
});

adminRouter.patch("/disputes/:id", async (req, res) => {
  const parsed = resolveDisputeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { status, resolution, refundPaise } = parsed.data;
  const terminal = status === "RESOLVED" || status === "REJECTED";

  const dispute = await prisma.dispute.update({
    where: { id: req.params.id },
    data: {
      status,
      resolution,
      ...(refundPaise !== undefined ? { refundPaise } : {}),
      handledBy: req.auth!.sub,
      ...(terminal ? { resolvedAt: new Date() } : {}),
    },
  });
  res.json(dispute);
});

// ─── Admin users (SUPER_ADMIN only) ───────────────────────────────────────────────

const ADMIN_ROLES = ["SUPER_ADMIN", "SUPPORT_AGENT", "CITY_MANAGER"] as const;

adminRouter.get("/admins", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(admins);
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  role: z.enum(ADMIN_ROLES).optional(),
});

adminRouter.post("/admins", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { email, password, name, role } = parsed.data;

  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "An admin with that email already exists" });
  }
  const admin = await prisma.adminUser.create({
    data: { email, name, role: role ?? "SUPPORT_AGENT", passwordHash: await bcrypt.hash(password, 10) },
  });
  res.status(201).json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
});

const updateRoleSchema = z.object({ role: z.enum(ADMIN_ROLES), active: z.boolean().optional() });

adminRouter.patch("/admins/:id", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const admin = await prisma.adminUser.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  res.json(admin);
});
