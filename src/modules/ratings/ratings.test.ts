import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000051";
const COOK_PHONE = "+911000000052";
const JWT_SECRET = requireJwtSecret();

let customerId: string;
let cookId: string;
let addressId: string;
let customerToken: string;
let cookToken: string;

async function completedBooking() {
  return prisma.booking.create({
    data: {
      customerId,
      cookId,
      addressId,
      tier: "BASIC",
      startAt: new Date(Date.now() - 3 * 3600 * 1000),
      durationMinutes: 60,
      servicePaise: 19900,
      totalPaise: 22945,
      status: "COMPLETED",
    },
  });
}

describe("ratings", () => {
  beforeAll(async () => {
    const c = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Rate Customer" } });
    customerId = c.id;
    const a = await prisma.address.create({
      data: { userId: customerId, line1: "5 Test Ct", city: "Bengaluru", pincode: "560102" },
    });
    addressId = a.id;
    const k = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Rate Cook", status: "ACTIVE" } });
    cookId = k.id;
    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { cookId } });
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: cookId } });
  });

  it("rates a completed booking once and updates the cook's average", async () => {
    const b1 = await completedBooking();
    const r1 = await request(app)
      .post("/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: b1.id, stars: 5, tags: ["Tasty", "Punctual"], comment: "Great" });
    expect(r1.status).toBe(201);
    expect(r1.body.tags).toEqual(["Tasty", "Punctual"]);

    // Second rating on the same booking is rejected.
    const dup = await request(app)
      .post("/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: b1.id, stars: 3 });
    expect(dup.status).toBe(409);

    const b2 = await completedBooking();
    await request(app)
      .post("/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: b2.id, stars: 3 });

    const feed = await request(app).get(`/ratings/cook/${cookId}`);
    expect(feed.status).toBe(200);
    expect(feed.body.count).toBe(2);
    expect(feed.body.average).toBe(4); // (5 + 3) / 2
  });

  it("won't rate a booking that isn't completed, or isn't yours", async () => {
    const pending = await prisma.booking.create({
      data: {
        customerId,
        cookId,
        addressId,
        tier: "BASIC",
        startAt: new Date(Date.now() + 3 * 3600 * 1000),
        durationMinutes: 60,
        servicePaise: 19900,
        totalPaise: 22945,
      },
    });
    const notDone = await request(app)
      .post("/ratings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: pending.id, stars: 5 });
    expect(notDone.status).toBe(409);

    const asCook = await request(app)
      .post("/ratings")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ bookingId: pending.id, stars: 5 });
    expect(asCook.status).toBe(403);
  });
});
