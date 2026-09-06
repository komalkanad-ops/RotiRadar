import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const disputesRouter = Router();

const createSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().min(1).max(4000),
});

// POST /disputes — { bookingId, reason } — either party raises a dispute on a booking (one per
// booking). `openedBy` is the caller's role. Admin resolution lives in the admin module.
disputesRouter.post("/", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER" && role !== "COOK") return res.status(403).json({ error: "Not allowed" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { bookingId, reason } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerId: true, cookId: true, dispute: { select: { id: true } } },
  });
  const owns =
    booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
  if (!owns) return res.status(404).json({ error: "Not found" });
  if (booking.dispute) return res.status(409).json({ error: "This booking already has an open dispute" });

  const dispute = await prisma.dispute.create({ data: { bookingId, openedBy: role, reason } });
  res.status(201).json(dispute);
});

// GET /disputes/booking/:bookingId — the dispute on a booking (either party).
disputesRouter.get("/booking/:bookingId", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    select: { customerId: true, cookId: true, dispute: true },
  });
  const owns =
    booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
  if (!owns) return res.status(404).json({ error: "Not found" });
  res.json(booking.dispute);
});
