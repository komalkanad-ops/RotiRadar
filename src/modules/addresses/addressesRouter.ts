import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

// A customer's saved delivery addresses. `POST /bookings` takes an `addressId`, so the customer
// app needs somewhere to create them first. Customer-only — a cook has no addresses.
export const addressesRouter = Router();

function requireCustomer(req: Request, res: Response): string | null {
  if (req.auth?.role !== "CUSTOMER") {
    res.status(403).json({ error: "Customer access required" });
    return null;
  }
  return req.auth.sub;
}

const PINCODE_RE = /^[1-9][0-9]{5}$/; // 6-digit Indian PIN, no leading zero

const addressSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  pincode: z.string().regex(PINCODE_RE, "pincode must be a 6-digit Indian PIN code"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

// GET /addresses — the caller's own saved addresses, newest first.
addressesRouter.get("/", requireAuth, async (req, res) => {
  const customerId = requireCustomer(req, res);
  if (!customerId) return;

  const addresses = await prisma.address.findMany({
    where: { userId: customerId },
    orderBy: { createdAt: "desc" },
  });
  res.json(addresses);
});

// POST /addresses — add one.
addressesRouter.post("/", requireAuth, async (req, res) => {
  const customerId = requireCustomer(req, res);
  if (!customerId) return;

  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const address = await prisma.address.create({ data: { userId: customerId, ...parsed.data } });
  res.status(201).json(address);
});

// PATCH /addresses/:id — edit one of the caller's own addresses.
addressesRouter.patch("/:id", requireAuth, async (req, res) => {
  const customerId = requireCustomer(req, res);
  if (!customerId) return;

  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== customerId) return res.status(404).json({ error: "Not found" });

  const address = await prisma.address.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(address);
});

// DELETE /addresses/:id — remove an address that isn't referenced by any booking. `Booking.address`
// is a required relation (default restrict on delete), so an address used by a past booking can't
// be deleted — return 409 rather than letting that surface as a 500.
addressesRouter.delete("/:id", requireAuth, async (req, res) => {
  const customerId = requireCustomer(req, res);
  if (!customerId) return;

  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== customerId) return res.status(404).json({ error: "Not found" });

  const usedBy = await prisma.booking.count({ where: { addressId: req.params.id } });
  if (usedBy > 0) return res.status(409).json({ error: "This address is used by a booking and can't be deleted" });

  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
