import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000031";
const COOK_PHONE = "+911000000032";
const JWT_SECRET = requireJwtSecret();

let customerId: string;
let cookId: string;
let customerToken: string;
let cookToken: string;

const validAddress = { label: "Home", line1: "42 Test Lane", city: "Bengaluru", pincode: "560102" };

describe("addresses", () => {
  beforeAll(async () => {
    const customer = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Addr Test Customer" } });
    customerId = customer.id;
    const cook = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Addr Test Cook", status: "ACTIVE" } });
    cookId = cook.id;
    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.address.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.cook.deleteMany({ where: { id: cookId } });
  });

  it("requires auth", async () => {
    const res = await request(app).get("/addresses");
    expect(res.status).toBe(401);
  });

  it("rejects a cook", async () => {
    const res = await request(app).get("/addresses").set("Authorization", `Bearer ${cookToken}`);
    expect(res.status).toBe(403);
  });

  it("rejects an invalid pincode", async () => {
    const res = await request(app)
      .post("/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...validAddress, pincode: "12" });
    expect(res.status).toBe(400);
  });

  it("creates, lists, updates and deletes an address", async () => {
    const created = await request(app)
      .post("/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(validAddress);
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app).get("/addresses").set("Authorization", `Bearer ${customerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.map((a: { id: string }) => a.id)).toContain(id);

    const patched = await request(app)
      .patch(`/addresses/${id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ label: "Office" });
    expect(patched.status).toBe(200);
    expect(patched.body.label).toBe("Office");

    const del = await request(app).delete(`/addresses/${id}`).set("Authorization", `Bearer ${customerToken}`);
    expect(del.status).toBe(204);
  });

  it("404s on another customer's address", async () => {
    const other = await prisma.user.create({ data: { phone: "+911000000033", name: "Other" } });
    const addr = await prisma.address.create({ data: { userId: other.id, ...validAddress } });
    const res = await request(app)
      .patch(`/addresses/${addr.id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ label: "Nope" });
    expect(res.status).toBe(404);
    await prisma.address.deleteMany({ where: { userId: other.id } });
    await prisma.user.deleteMany({ where: { id: other.id } });
  });

  it("won't delete an address used by a booking", async () => {
    const addr = await prisma.address.create({ data: { userId: customerId, ...validAddress } });
    const booking = await prisma.booking.create({
      data: {
        customerId,
        addressId: addr.id,
        tier: "BASIC",
        startAt: new Date(Date.now() + 86_400_000),
        durationMinutes: 60,
        servicePaise: 19900,
        platformFeePaise: 0,
        taxPaise: 0,
        totalPaise: 19900,
      },
    });
    const res = await request(app).delete(`/addresses/${addr.id}`).set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(409);
    await prisma.booking.deleteMany({ where: { id: booking.id } });
    await prisma.address.deleteMany({ where: { id: addr.id } });
  });

  it("exposes the cook in the public directory without PII", async () => {
    await prisma.cookServiceOffering.create({
      data: { cookId, tier: "BASIC", ratePaise: 19900, cuisines: "north-indian" },
    });
    const res = await request(app).get("/cooks/directory");
    expect(res.status).toBe(200);
    const mine = res.body.find((c: { id: string }) => c.id === cookId);
    expect(mine).toBeTruthy();
    expect(mine.phone).toBeUndefined();
    expect(mine.offerings[0].tier).toBe("BASIC");

    const one = await request(app).get(`/cooks/directory/${cookId}`);
    expect(one.status).toBe(200);
    expect(one.body.phone).toBeUndefined();

    await prisma.cookServiceOffering.deleteMany({ where: { cookId } });
  });
});
