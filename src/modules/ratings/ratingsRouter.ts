import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const ratingsRouter = Router();

const csv = (arr: string[] | undefined) => (arr ? arr.join(",") : "");
const fromCsv = (s: string) => (s ? s.split(",").filter(Boolean) : []);

const createSchema = z.object({
  bookingId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.string().min(1)).max(8).optional(), // Clean / Punctual / Tasty / Polite / ...
  comment: z.string().max(2000).optional(),
});

// POST /ratings — { bookingId, stars, tags?, comment? } — the customer rates a COMPLETED booking
// once. Recomputes the cook's running average in the same transaction.
ratingsRouter.post("/", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER") return res.status(403).json({ error: "Customer access required" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { bookingId, stars, tags, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { rating: { select: { id: true } } },
  });
  if (!booking || booking.customerId !== sub) return res.status(404).json({ error: "Not found" });
  if (booking.status !== "COMPLETED") return res.status(409).json({ error: "Only completed bookings can be rated" });
  if (!booking.cookId) return res.status(409).json({ error: "This booking has no cook to rate" });
  if (booking.rating) return res.status(409).json({ error: "This booking is already rated" });

  const cookId = booking.cookId;
  const rating = await prisma.$transaction(async (tx) => {
    const r = await tx.rating.create({
      data: { bookingId, customerId: sub, cookId, stars, tags: csv(tags), comment },
    });
    const agg = await tx.rating.aggregate({ where: { cookId }, _avg: { stars: true }, _count: true });
    await tx.cook.update({
      where: { id: cookId },
      data: { ratingAvg: agg._avg.stars ?? 0, ratingCount: agg._count },
    });
    return r;
  });
  res.status(201).json({ ...rating, tags: fromCsv(rating.tags) });
});

// GET /ratings/booking/:bookingId — the rating for one booking (either party).
ratingsRouter.get("/booking/:bookingId", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    select: { customerId: true, cookId: true, rating: true },
  });
  const owns =
    booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
  if (!owns) return res.status(404).json({ error: "Not found" });
  res.json(booking.rating ? { ...booking.rating, tags: fromCsv(booking.rating.tags) } : null);
});

// GET /ratings/cook/:cookId?page=&pageSize= — a cook's public rating feed (no customer identity).
ratingsRouter.get("/cook/:cookId", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const cook = await prisma.cook.findUnique({
    where: { id: req.params.cookId },
    select: { ratingAvg: true, ratingCount: true },
  });
  if (!cook) return res.status(404).json({ error: "Not found" });

  const ratings = await prisma.rating.findMany({
    where: { cookId: req.params.cookId },
    select: { stars: true, tags: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  res.json({
    average: cook.ratingAvg,
    count: cook.ratingCount,
    ratings: ratings.map((r) => ({ ...r, tags: fromCsv(r.tags) })),
  });
});
