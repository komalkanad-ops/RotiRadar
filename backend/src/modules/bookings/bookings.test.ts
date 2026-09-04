import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

// Fake, obviously-test-only customer/cook/address so a run against a real database never mixes
// with genuine data. Created directly via Prisma — the auth/registration paths are already
// covered by auth.test.ts, this file is about booking state transitions.
const CUSTOMER_PHONE = "+911000000021";
const COOK_PHONE = "+911000000022";
const OTHER_COOK_PHONE = "+911000000023";
const JWT_SECRET = requireJwtSecret();

let customerId: string;
let cookId: string;
let otherCookId: string;
let addressId: string;
let customerToken: string;
let cookToken: string;
let otherCookToken: string;

function futureIso(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

async function createBooking(overrides: Record<string, unknown> = {}) {
  return request(app)
    .post("/bookings")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ tier: "BASIC", addressId, startAt: futureIso(5), cookId, ...overrides });
}

describe("bookings", () => {
  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Test Customer" } });
    customerId = customer.id;
    const address = await prisma.address.create({
      data: { userId: customerId, line1: "123 Test St", city: "Bengaluru", pincode: "560102" },
    });
    addressId = address.id;

    const cook = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Test Cook", status: "ACTIVE" } });
    cookId = cook.id;
    const otherCook = await prisma.cook.create({
      data: { phone: OTHER_COOK_PHONE, name: "Other Cook", status: "ACTIVE" },
    });
    otherCookId = otherCook.id;

    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
    otherCookToken = jwt.sign({ sub: otherCookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.bookingStatusEvent.deleteMany({ where: { booking: { customerId } } });
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: { in: [cookId, otherCookId] } } });
  });

  it("rejects a booking with neither cookId nor autoAssign", async () => {
    const res = await createBooking({ cookId: undefined });
    expect(res.status).toBe(400);
  });

  it("rejects a booking in the past", async () => {
    const res = await createBooking({ startAt: futureIso(-1) });
    expect(res.status).toBe(400);
  });

  it("rejects someone else's address", async () => {
    const res = await createBooking({ addressId: "not-mine" });
    expect(res.status).toBe(400);
  });

  it("rejects a duration outside the tier's bounds", async () => {
    const res = await createBooking({ durationMinutes: 999 });
    expect(res.status).toBe(400);
  });

  it("creates a booking with computed pricing and a PENDING status event", async () => {
    const res = await createBooking();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.servicePaise).toBe(19900); // BASIC base price, no cook-specific offering
    expect(res.body.totalPaise).toBeGreaterThan(res.body.servicePaise);

    const detail = await request(app).get(`/bookings/${res.body.id}`).set("Authorization", `Bearer ${customerToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.statusEvents).toHaveLength(1);
    expect(detail.body.statusEvents[0].status).toBe("PENDING");
  });

  it("hides a booking from a cook it isn't assigned to (404, not 403)", async () => {
    const created = await createBooking();
    const res = await request(app)
      .get(`/bookings/${created.body.id}`)
      .set("Authorization", `Bearer ${otherCookToken}`);
    expect(res.status).toBe(404);
  });

  it("rejects a booking, freeing it for another cook to accept", async () => {
    const created = await createBooking();
    const bookingId = created.body.id;

    const rejected = await request(app)
      .post(`/bookings/${bookingId}/reject`)
      .set("Authorization", `Bearer ${cookToken}`);
    expect(rejected.status).toBe(200);
    expect(rejected.body.status).toBe("PENDING");
    expect(rejected.body.cookId).toBeNull();

    const accepted = await request(app)
      .post(`/bookings/${bookingId}/accept`)
      .set("Authorization", `Bearer ${otherCookToken}`);
    expect(accepted.status).toBe(200);
    expect(accepted.body.status).toBe("ACCEPTED");
    expect(accepted.body.cookId).toBe(otherCookId);
  });

  it("walks a booking through the full status lifecycle in order", async () => {
    const created = await createBooking();
    const bookingId = created.body.id;

    const accept = await request(app).post(`/bookings/${bookingId}/accept`).set("Authorization", `Bearer ${cookToken}`);
    expect(accept.status).toBe(200);

    // Can't skip ahead.
    const skip = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ status: "IN_PROGRESS" });
    expect(skip.status).toBe(409);

    for (const status of ["ON_THE_WAY", "IN_PROGRESS", "COMPLETED"]) {
      const res = await request(app)
        .post(`/bookings/${bookingId}/status`)
        .set("Authorization", `Bearer ${cookToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }

    // Terminal — can't advance further.
    const past = await request(app)
      .post(`/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ status: "ON_THE_WAY" });
    expect(past.status).toBe(409);
  });

  it("blocks another cook from advancing someone else's booking", async () => {
    const created = await createBooking();
    await request(app).post(`/bookings/${created.body.id}/accept`).set("Authorization", `Bearer ${cookToken}`);

    const res = await request(app)
      .post(`/bookings/${created.body.id}/status`)
      .set("Authorization", `Bearer ${otherCookToken}`)
      .send({ status: "ON_THE_WAY" });
    expect(res.status).toBe(403);
  });

  it("cancels for free well outside the cutoff window", async () => {
    const created = await createBooking({ startAt: futureIso(48) });
    const res = await request(app)
      .post(`/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ reason: "Plans changed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect(res.body.cancelledBy).toBe("CUSTOMER");
    expect(res.body.cancellationFeePaise).toBe(0);
  });

  it("applies the cancellation fee inside the cutoff window", async () => {
    // cancellation_cutoff_minutes is seeded at 120 — a slot 1 hour out is inside it.
    const created = await createBooking({ startAt: futureIso(1) });
    const res = await request(app)
      .post(`/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cancellationFeePaise).toBeGreaterThan(0);
  });

  it("won't cancel an already-completed booking", async () => {
    const created = await createBooking();
    await request(app).post(`/bookings/${created.body.id}/accept`).set("Authorization", `Bearer ${cookToken}`);
    for (const status of ["ON_THE_WAY", "IN_PROGRESS", "COMPLETED"]) {
      await request(app)
        .post(`/bookings/${created.body.id}/status`)
        .set("Authorization", `Bearer ${cookToken}`)
        .send({ status });
    }
    const res = await request(app)
      .post(`/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(409);
  });

  it("scopes GET /bookings to the caller", async () => {
    await createBooking();
    const asCustomer = await request(app).get("/bookings").set("Authorization", `Bearer ${customerToken}`);
    expect(asCustomer.status).toBe(200);
    expect(asCustomer.body.length).toBeGreaterThan(0);
    expect(asCustomer.body.every((b: { customerId: string }) => b.customerId === customerId)).toBe(true);

    const asOtherCook = await request(app).get("/bookings").set("Authorization", `Bearer ${otherCookToken}`);
    expect(asOtherCook.status).toBe(200);
    expect(asOtherCook.body.every((b: { cookId: string }) => b.cookId === otherCookId)).toBe(true);
  });
});
