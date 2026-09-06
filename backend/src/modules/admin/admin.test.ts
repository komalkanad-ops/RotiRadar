import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

const JWT_SECRET = requireJwtSecret();
const superToken = jwt.sign({ sub: "vitest-super", role: "ADMIN", adminRole: "SUPER_ADMIN" }, JWT_SECRET, {
  expiresIn: "1h",
});
const agentToken = jwt.sign({ sub: "vitest-agent", role: "ADMIN", adminRole: "SUPPORT_AGENT" }, JWT_SECRET, {
  expiresIn: "1h",
});
const customerToken = jwt.sign({ sub: "vitest-cust", role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "1h" });

const THROWAWAY_ADMIN_EMAIL = "vitest-admin-mgmt@rotiradar.test";

let originalConfig: Record<string, string> = {};

describe("admin", () => {
  beforeAll(async () => {
    const rows = await prisma.appConfig.findMany();
    originalConfig = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  });

  afterAll(async () => {
    // Restore any config keys the tests touched.
    await prisma.$transaction(
      Object.entries(originalConfig).map(([key, value]) =>
        prisma.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );
    await prisma.adminUser.deleteMany({ where: { email: THROWAWAY_ADMIN_EMAIL } });
  });

  it("blocks non-admin and non-super callers", async () => {
    expect((await request(app).get("/admin/stats")).status).toBe(401);
    expect((await request(app).get("/admin/stats").set("Authorization", `Bearer ${customerToken}`)).status).toBe(401);
    expect((await request(app).get("/admin/admins").set("Authorization", `Bearer ${agentToken}`)).status).toBe(403);
  });

  it("returns dashboard stats", async () => {
    const res = await request(app).get("/admin/stats").set("Authorization", `Bearer ${agentToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.users).toBe("number");
    expect(res.body.cooks).toBeTypeOf("object");
    expect(res.body.bookings).toBeTypeOf("object");
    expect(typeof res.body.grossPaidPaise).toBe("number");
  });

  it("lists bookings and customers", async () => {
    const b = await request(app).get("/admin/bookings?pageSize=5").set("Authorization", `Bearer ${agentToken}`);
    expect(b.status).toBe(200);
    expect(Array.isArray(b.body)).toBe(true);

    const badStatus = await request(app)
      .get("/admin/bookings?status=NOPE")
      .set("Authorization", `Bearer ${agentToken}`);
    expect(badStatus.status).toBe(400);

    const u = await request(app).get("/admin/users?pageSize=5").set("Authorization", `Bearer ${agentToken}`);
    expect(u.status).toBe(200);
    expect(Array.isArray(u.body)).toBe(true);
  });

  it("reads and updates config (allowed keys only), then restores", async () => {
    const before = await request(app).get("/admin/config").set("Authorization", `Bearer ${agentToken}`);
    expect(before.status).toBe(200);
    expect(before.body).toHaveProperty("gst_percent");

    const bad = await request(app)
      .patch("/admin/config")
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ not_a_real_key: "1" });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .patch("/admin/config")
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ gst_percent: "6" });
    expect(ok.status).toBe(200);
    expect(ok.body.gst_percent).toBe("6");

    // Put it back immediately (afterAll also restores as a safety net).
    await request(app)
      .patch("/admin/config")
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ gst_percent: originalConfig.gst_percent ?? "5" });
  });

  it("SUPER_ADMIN manages admin users", async () => {
    const list = await request(app).get("/admin/admins").set("Authorization", `Bearer ${superToken}`);
    expect(list.status).toBe(200);

    const create = await request(app)
      .post("/admin/admins")
      .set("Authorization", `Bearer ${superToken}`)
      .send({ email: THROWAWAY_ADMIN_EMAIL, password: "a-long-enough-password", name: "Vitest Agent" });
    expect(create.status).toBe(201);
    expect(create.body.role).toBe("SUPPORT_AGENT");

    const promote = await request(app)
      .patch(`/admin/admins/${create.body.id}`)
      .set("Authorization", `Bearer ${superToken}`)
      .send({ role: "CITY_MANAGER" });
    expect(promote.status).toBe(200);
    expect(promote.body.role).toBe("CITY_MANAGER");

    // An agent can't do any of this.
    const denied = await request(app)
      .post("/admin/admins")
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ email: "x@y.z", password: "12345678", name: "x" });
    expect(denied.status).toBe(403);
  });
});
