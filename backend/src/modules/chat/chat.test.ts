import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000031";
const COOK_PHONE = "+911000000032";
const OTHER_COOK_PHONE = "+911000000033";
const JWT_SECRET = requireJwtSecret();

let customerId: string;
let cookId: string;
let otherCookId: string;
let bookingId: string;
let customerToken: string;
let cookToken: string;
let otherCookToken: string;

describe("chat", () => {
  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Chat Customer" } });
    customerId = customer.id;
    const address = await prisma.address.create({
      data: { userId: customerId, line1: "1 Test Rd", city: "Bengaluru", pincode: "560102" },
    });
    const cook = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Chat Cook", status: "ACTIVE" } });
    cookId = cook.id;
    const otherCook = await prisma.cook.create({ data: { phone: OTHER_COOK_PHONE, name: "Nosy Cook", status: "ACTIVE" } });
    otherCookId = otherCook.id;
    const booking = await prisma.booking.create({
      data: {
        customerId,
        cookId,
        addressId: address.id,
        tier: "BASIC",
        startAt: new Date(Date.now() + 3 * 3600 * 1000),
        durationMinutes: 60,
        servicePaise: 19900,
        totalPaise: 22945,
      },
    });
    bookingId = booking.id;

    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
    otherCookToken = jwt.sign({ sub: otherCookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { bookingId } });
    await prisma.bookingStatusEvent.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: { in: [cookId, otherCookId] } } });
  });

  it("hides the conversation from a non-participant (404)", async () => {
    const res = await request(app).get(`/chat/${bookingId}/messages`).set("Authorization", `Bearer ${otherCookToken}`);
    expect(res.status).toBe(404);
  });

  it("both parties can post; senderRole comes from the token", async () => {
    const fromCustomer = await request(app)
      .post(`/chat/${bookingId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ body: "Hi, running 10 min late?" });
    expect(fromCustomer.status).toBe(201);
    expect(fromCustomer.body.senderRole).toBe("CUSTOMER");

    const fromCook = await request(app)
      .post(`/chat/${bookingId}/messages`)
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ body: "No problem, see you soon." });
    expect(fromCook.status).toBe(201);
    expect(fromCook.body.senderRole).toBe("COOK");
  });

  it("polls with and without an `after` cursor", async () => {
    const all = await request(app).get(`/chat/${bookingId}/messages`).set("Authorization", `Bearer ${cookToken}`);
    expect(all.status).toBe(200);
    expect(all.body.length).toBe(2);
    expect(all.body[0].body).toContain("late"); // oldest first

    const afterFirst = await request(app)
      .get(`/chat/${bookingId}/messages?after=${all.body[0].id}`)
      .set("Authorization", `Bearer ${cookToken}`);
    expect(afterFirst.status).toBe(200);
    expect(afterFirst.body.length).toBe(1);
    expect(afterFirst.body[0].id).toBe(all.body[1].id);

    const badCursor = await request(app)
      .get(`/chat/${bookingId}/messages?after=not-a-real-id`)
      .set("Authorization", `Bearer ${cookToken}`);
    expect(badCursor.status).toBe(400);
  });

  it("marks the other party's messages read", async () => {
    const res = await request(app).post(`/chat/${bookingId}/read`).set("Authorization", `Bearer ${cookToken}`);
    expect(res.status).toBe(200);
    expect(res.body.marked).toBe(1); // the one customer message

    const again = await request(app).post(`/chat/${bookingId}/read`).set("Authorization", `Bearer ${cookToken}`);
    expect(again.body.marked).toBe(0);
  });

  it("rejects an empty message body", async () => {
    const res = await request(app)
      .post(`/chat/${bookingId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ body: "" });
    expect(res.status).toBe(400);
  });
});
