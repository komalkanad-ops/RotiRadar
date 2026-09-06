import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const CUSTOMER_PHONE = "+911000000061";
const JWT_SECRET = requireJwtSecret();
const adminToken = jwt.sign({ sub: "vitest-admin-rep", role: "ADMIN", adminRole: "SUPPORT_AGENT" }, JWT_SECRET, {
  expiresIn: "1h",
});

let customerId: string;
let customerToken: string;

describe("reports", () => {
  beforeAll(async () => {
    const c = await prisma.user.create({ data: { phone: CUSTOMER_PHONE, name: "Report Customer" } });
    customerId = c.id;
    customerToken = jwt.sign({ sub: customerId, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { userId: customerId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
  });

  it("files a report, lists it, and an admin triages it", async () => {
    const filed = await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ category: "safety", detail: "Cook was aggressive on the phone." });
    expect(filed.status).toBe(201);
    expect(filed.body.status).toBe("OPEN");

    const mine = await request(app).get("/reports/mine").set("Authorization", `Bearer ${customerToken}`);
    expect(mine.body.length).toBe(1);

    const adminList = await request(app).get("/admin/reports?status=OPEN").set("Authorization", `Bearer ${adminToken}`);
    expect(adminList.status).toBe(200);
    expect(adminList.body.some((r: { id: string }) => r.id === filed.body.id)).toBe(true);

    const triaged = await request(app)
      .patch(`/admin/reports/${filed.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ACTIONED", actionTaken: "Warned the cook." });
    expect(triaged.status).toBe(200);
    expect(triaged.body.status).toBe("ACTIONED");
    expect(triaged.body.handledBy).toBe("vitest-admin-rep");
  });

  it("rejects an empty detail and a bad bookingId", async () => {
    const empty = await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ category: "other", detail: "" });
    expect(empty.status).toBe(400);

    const badBooking = await request(app)
      .post("/reports")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ category: "other", detail: "x", bookingId: "not-mine" });
    expect(badBooking.status).toBe(400);
  });
});
