import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000071";
const COOK_PHONE = "+911000000072";
const JWT_SECRET = requireJwtSecret();
const adminToken = jwt.sign({ sub: "vitest-admin-dis", role: "ADMIN", adminRole: "SUPPORT_AGENT" }, JWT_SECRET, {
  expiresIn: "1h",
});

let customerId: string;
let cookId: string;
let bookingId: string;
let customerToken: string;

describe("disputes", () => {
  beforeAll(async () => {
    const c = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Dispute Customer" } });
    customerId = c.id;
    const a = await prisma.address.create({
      data: { userId: customerId, line1: "7 Test Blvd", city: "Bengaluru", pincode: "560102" },
    });
    const k = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Dispute Cook", status: "ACTIVE" } });
    cookId = k.id;
    const b = await prisma.booking.create({
      data: {
        customerId,
        cookId,
        addressId: a.id,
        tier: "FULL_MEAL",
        startAt: new Date(Date.now() - 2 * 3600 * 1000),
        durationMinutes: 120,
        servicePaise: 99900,
        totalPaise: 115000,
        status: "COMPLETED",
      },
    });
    bookingId = b.id;
    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.dispute.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { customerId } });
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: cookId } });
  });

  it("opens a dispute (one per booking) and an admin resolves it with a refund", async () => {
    const opened = await request(app)
      .post("/disputes")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId, reason: "Only 2 of 5 dishes were made." });
    expect(opened.status).toBe(201);
    expect(opened.body.openedBy).toBe("CUSTOMER");

    const dup = await request(app)
      .post("/disputes")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId, reason: "again" });
    expect(dup.status).toBe(409);

    const adminList = await request(app).get("/admin/disputes?status=OPEN").set("Authorization", `Bearer ${adminToken}`);
    expect(adminList.body.some((d: { id: string }) => d.id === opened.body.id)).toBe(true);

    const resolved = await request(app)
      .patch(`/admin/disputes/${opened.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "RESOLVED", resolution: "Partial refund issued.", refundPaise: 40000 });
    expect(resolved.status).toBe(200);
    expect(resolved.body.status).toBe("RESOLVED");
    expect(resolved.body.refundPaise).toBe(40000);
    expect(resolved.body.resolvedAt).toBeTruthy();

    const mine = await request(app)
      .get(`/disputes/booking/${bookingId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(mine.body.status).toBe("RESOLVED");
  });
});
