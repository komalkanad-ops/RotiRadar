import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const reportsRouter = Router();

const createSchema = z.object({
  category: z.string().min(1).max(60), // "safety" | "no_show" | "payment" | "behaviour" | "other" | ...
  detail: z.string().min(1).max(4000),
  bookingId: z.string().min(1).optional(),
  attachmentUrl: z.string().url().optional(),
});

// POST /reports — { category, detail, bookingId?, attachmentUrl? } — a customer or cook files a
// safety/conduct report. The reporter is recorded (userId for a customer, cookId for a cook);
// admin triage lives in the admin module.
reportsRouter.post("/", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER" && role !== "COOK") return res.status(403).json({ error: "Not allowed" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { category, detail, bookingId, attachmentUrl } = parsed.data;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true, cookId: true } });
    const linked =
      booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
    if (!linked) return res.status(400).json({ error: "Invalid bookingId" });
  }

  const report = await prisma.report.create({
    data: {
      category,
      detail,
      bookingId,
      attachmentUrl,
      userId: role === "CUSTOMER" ? sub : undefined,
      cookId: role === "COOK" ? sub : undefined,
    },
  });
  res.status(201).json(report);
});

// GET /reports/mine — the caller's own filed reports.
reportsRouter.get("/mine", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  const where = role === "CUSTOMER" ? { userId: sub } : { cookId: sub };
  const reports = await prisma.report.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  res.json(reports);
});
