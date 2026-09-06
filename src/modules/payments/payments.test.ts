import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000041";
const COOK_PHONE = "+911000000042";
const JWT_SECRET = requireJwtSecret();

let customerId: string;
let addressId: string;
let cookId: string;
let customerToken: string;
let cookToken: string;

async function newBooking() {
  const b = await prisma.booking.create({
    data: {
      customerId,
      addressId,
      tier: "BASIC",
      startAt: new Date(Date.now() + 4 * 3600 * 1000),
      durationMinutes: 60,
      servicePaise: 19900,
      platformFeePaise: 1990,
      taxPaise: 1095,
      totalPaise: 22985,
    },
  });
  return b.id;
}

describe("payments (mock mode)", () => {
  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Pay Customer" } });
    customerId = customer.id;
    const address = await prisma.address.create({
      data: { userId: customerId, line1: "9 Test Ln", city: "Bengaluru", pincode: "560102" },
    });
    addressId = address.id;
    const cook = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Pay Cook", status: "ACTIVE" } });
    cookId = cook.id;
    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { booking: { customerId } } });
    await prisma.bookingStatusEvent.deleteMany({ where: { booking: { customerId } } });
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: cookId } });
  });

  it("full happy path: order → verify → paid, and the order can't be re-paid", async () => {
    const bookingId = await newBooking();

    const order = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });
    expect(order.status).toBe(200);
    expect(order.body.orderId).toMatch(/^order_/);
    expect(order.body.amountPaise).toBe(22985);
    expect(order.body.mock).toBe(true);

    // Re-requesting an order reuses the open one.
    const order2 = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });
    expect(order2.body.orderId).toBe(order.body.orderId);

    const verify = await request(app)
      .post("/payments/verify")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: order.body.orderId });
    expect(verify.status).toBe(200);
    expect(verify.body.status).toBe("paid");
    expect(verify.body.paymentId).toMatch(/^pay_/);

    const status = await request(app)
      .get(`/payments/booking/${bookingId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(status.body.status).toBe("PAID");

    const reorder = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });
    expect(reorder.status).toBe(409);
  });

  it("the webhook (gateway confirmation) also marks an order paid", async () => {
    const bookingId = await newBooking();
    const order = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });

    const hook = await request(app)
      .post("/payments/webhook")
      .send({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: order.body.orderId, id: "pay_hooktest01", status: "captured" } } },
      });
    expect(hook.status).toBe(200);
    expect(hook.body.ok).toBe(true);

    const txn = await prisma.transaction.findUnique({ where: { providerOrderId: order.body.orderId } });
    expect(txn?.status).toBe("PAID");
    expect(txn?.providerPaymentId).toBe("pay_hooktest01");
  });

  it("a cook can't create an order; a cancelled booking can't be paid", async () => {
    const bookingId = await newBooking();
    const asCook = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ bookingId });
    expect(asCook.status).toBe(403);

    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
    const cancelled = await request(app)
      .post("/payments/order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId });
    expect(cancelled.status).toBe(409);
  });
});
