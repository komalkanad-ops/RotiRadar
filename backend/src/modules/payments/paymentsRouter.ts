import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const paymentsRouter = Router();

// Mock mode until a real Razorpay secret is configured. In mock mode every payment "succeeds":
// /payments/verify and the webhook just flip the Transaction to PAID. The request/response shapes
// deliberately mirror Razorpay's so the client and the eventual real integration don't change.
const MOCK = !process.env.RAZORPAY_KEY_SECRET;
const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_mock";
const PROVIDER = MOCK ? "razorpay-mock" : "razorpay";

function rzpId(prefix: "order" | "pay"): string {
  return `${prefix}_${crypto.randomBytes(11).toString("base64url").slice(0, 14)}`;
}

// ─── Create an order (what the client hands to a checkout) ────────────────────────

const orderSchema = z.object({ bookingId: z.string().min(1) });

// POST /payments/order — { bookingId } — customer only. Reuses an existing un-paid order for the
// booking if one exists, else creates one. Amount is the booking's own total.
paymentsRouter.post("/order", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER") return res.status(403).json({ error: "Customer access required" });

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking || booking.customerId !== sub) return res.status(404).json({ error: "Not found" });
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    return res.status(409).json({ error: `Cannot pay for a ${booking.status} booking` });
  }

  const paid = await prisma.transaction.findFirst({ where: { bookingId: booking.id, status: "PAID" } });
  if (paid) return res.status(409).json({ error: "This booking is already paid" });

  let txn = await prisma.transaction.findFirst({ where: { bookingId: booking.id, status: "CREATED" } });
  if (!txn) {
    txn = await prisma.transaction.create({
      data: {
        bookingId: booking.id,
        amountPaise: booking.totalPaise,
        provider: PROVIDER,
        providerOrderId: rzpId("order"),
      },
    });
  }

  res.json({
    orderId: txn.providerOrderId,
    amountPaise: txn.amountPaise,
    currency: "INR",
    keyId: KEY_ID,
    bookingId: booking.id,
    mock: MOCK,
  });
});

// ─── Verify (client-side callback after the checkout closes) ──────────────────────

const verifySchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

// POST /payments/verify — { orderId, paymentId?, signature? } — customer confirms the checkout
// result. Mock mode: always marks PAID. Real mode: verifies the Razorpay signature (not wired yet).
paymentsRouter.post("/verify", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  if (role !== "CUSTOMER") return res.status(403).json({ error: "Customer access required" });

  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { orderId, paymentId, signature } = parsed.data;

  const txn = await prisma.transaction.findUnique({
    where: { providerOrderId: orderId },
    include: { booking: { select: { customerId: true } } },
  });
  if (!txn || txn.booking.customerId !== sub) return res.status(404).json({ error: "Not found" });
  if (txn.status === "PAID") {
    return res.json({ status: "paid", orderId, paymentId: txn.providerPaymentId, amountPaise: txn.amountPaise });
  }
  if (txn.status !== "CREATED") return res.status(409).json({ error: `Order is ${txn.status}` });

  if (!MOCK) {
    // Real Razorpay: expected = HMAC_SHA256(`${orderId}|${paymentId}`, RAZORPAY_KEY_SECRET).
    // Not implemented yet — a real key is configured but the verification path isn't wired.
    if (!paymentId || !signature) return res.status(400).json({ error: "paymentId and signature required" });
    return res.status(501).json({ error: "Live Razorpay verification not implemented yet" });
  }

  const updated = await prisma.transaction.update({
    where: { id: txn.id },
    data: { status: "PAID", providerPaymentId: paymentId ?? rzpId("pay") },
  });
  res.json({ status: "paid", orderId, paymentId: updated.providerPaymentId, amountPaise: updated.amountPaise });
});

// ─── Webhook (the gateway's own server-to-server confirmation) ────────────────────

// POST /payments/webhook — Razorpay-shaped body: { event, payload: { payment: { entity: {...} } } }.
// No auth (called by the gateway). Real mode verifies the `x-razorpay-signature` header against the
// raw body with RAZORPAY_WEBHOOK_SECRET; mock mode skips that. Idempotent.
paymentsRouter.post("/webhook", async (req, res) => {
  if (!MOCK) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const sig = req.header("x-razorpay-signature");
    const raw = (req as { rawBody?: string }).rawBody ?? "";
    if (!secret || !sig) return res.status(400).json({ error: "Missing signature" });
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      return res.status(401).json({ error: "Bad signature" });
    }
  }

  const entity = req.body?.payload?.payment?.entity as
    | { order_id?: string; id?: string; status?: string }
    | undefined;
  const orderId = entity?.order_id;
  if (!orderId) return res.status(400).json({ error: "No order_id in payload" });

  const txn = await prisma.transaction.findUnique({ where: { providerOrderId: orderId } });
  if (!txn) return res.status(404).json({ error: "Unknown order" });

  const event = req.body?.event as string | undefined;
  if (txn.status === "CREATED" && (event === "payment.captured" || entity?.status === "captured")) {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: "PAID", providerPaymentId: entity?.id ?? txn.providerPaymentId ?? rzpId("pay") },
    });
  } else if (txn.status === "CREATED" && event === "payment.failed") {
    await prisma.transaction.update({ where: { id: txn.id }, data: { status: "FAILED" } });
  }
  res.json({ ok: true });
});

// ─── Read ─────────────────────────────────────────────────────────────────────────

// GET /payments/booking/:bookingId — the latest transaction for a booking (customer or cook).
paymentsRouter.get("/booking/:bookingId", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    select: { customerId: true, cookId: true },
  });
  const owns =
    booking && ((role === "CUSTOMER" && booking.customerId === sub) || (role === "COOK" && booking.cookId === sub));
  if (!owns) return res.status(404).json({ error: "Not found" });

  const txn = await prisma.transaction.findFirst({
    where: { bookingId: req.params.bookingId },
    orderBy: { createdAt: "desc" },
  });
  res.json(txn);
});
