import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

// Fake, obviously-test-only identities so a run against a real database (not just CI's throwaway
// one) never mixes with genuine user/admin data. Cleaned up in afterAll regardless of pass/fail.
const CUSTOMER_PHONE = "+911000000001";
const COOK_PHONE = "+911000000002";
const THROWAWAY_ADMIN_EMAIL = "vitest-throwaway-admin@rotiradar.test";
const THROWAWAY_ADMIN_PASSWORD = "vitest-only-password-not-real";

describe("auth", () => {
  afterAll(async () => {
    await prisma.otpChallenge.deleteMany({ where: { phone: { in: [CUSTOMER_PHONE, COOK_PHONE] } } });
    await prisma.user.deleteMany({ where: { phone: CUSTOMER_PHONE } });
    await prisma.cook.deleteMany({ where: { phone: COOK_PHONE } });
    await prisma.adminUser.deleteMany({ where: { email: THROWAWAY_ADMIN_EMAIL } });
  });

  it("rejects an invalid phone on otp/request", async () => {
    const res = await request(app).post("/auth/otp/request").send({ phone: "abc", role: "customer" });
    expect(res.status).toBe(400);
  });

  it("logs a customer in via OTP, registering them on first use", async () => {
    const otpRes = await request(app).post("/auth/otp/request").send({ phone: CUSTOMER_PHONE, role: "customer" });
    expect(otpRes.status).toBe(200);
    expect(otpRes.body.devCode).toMatch(/^\d{6}$/);

    const wrongCode = await request(app)
      .post("/auth/otp/verify")
      .send({ phone: CUSTOMER_PHONE, role: "customer", code: "000000" });
    expect(wrongCode.status).toBe(401);

    const verifyRes = await request(app)
      .post("/auth/otp/verify")
      .send({ phone: CUSTOMER_PHONE, role: "customer", code: otpRes.body.devCode });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.role).toBe("CUSTOMER");
    expect(verifyRes.body.token).toBeTruthy();

    const meRes = await request(app).get("/auth/me").set("Authorization", `Bearer ${verifyRes.body.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.phone).toBe(CUSTOMER_PHONE);

    // A consumed code can't be replayed.
    const replay = await request(app)
      .post("/auth/otp/verify")
      .send({ phone: CUSTOMER_PHONE, role: "customer", code: otpRes.body.devCode });
    expect(replay.status).toBe(401);
  });

  it("requires a name to register a brand-new cook, without burning the code", async () => {
    const otpRes = await request(app).post("/auth/otp/request").send({ phone: COOK_PHONE, role: "cook" });
    const code = otpRes.body.devCode;

    const noName = await request(app).post("/auth/otp/verify").send({ phone: COOK_PHONE, role: "cook", code });
    expect(noName.status).toBe(400);

    // Same code still works once a name is supplied — it wasn't consumed by the failed attempt above.
    const withName = await request(app)
      .post("/auth/otp/verify")
      .send({ phone: COOK_PHONE, role: "cook", code, name: "Test Cook" });
    expect(withName.status).toBe(200);
    expect(withName.body.role).toBe("COOK");
  });

  it("rejects an admin login with the wrong password", async () => {
    const res = await request(app).post("/auth/admin/login").send({ email: "nobody@rotiradar.in", password: "x" });
    expect(res.status).toBe(401);
  });

  it("logs an admin in and issues a token /auth/me rejects (admin ≠ customer/cook)", async () => {
    const passwordHash = await bcrypt.hash(THROWAWAY_ADMIN_PASSWORD, 10);
    await prisma.adminUser.create({
      data: { email: THROWAWAY_ADMIN_EMAIL, passwordHash, name: "Vitest Admin", role: "SUPER_ADMIN" },
    });

    const loginRes = await request(app)
      .post("/auth/admin/login")
      .send({ email: THROWAWAY_ADMIN_EMAIL, password: THROWAWAY_ADMIN_PASSWORD });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.role).toBe("ADMIN");
    expect(loginRes.body.token).toBeTruthy();

    const meRes = await request(app).get("/auth/me").set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(meRes.status).toBe(401);
  });

  it("admin/bootstrap creates the first admin (if none exists) then always 409s after", async () => {
    const before = await prisma.adminUser.count();
    const first = await request(app).post("/auth/admin/bootstrap");
    expect(first.status).toBe(before === 0 ? 200 : 409);

    const second = await request(app).post("/auth/admin/bootstrap");
    expect(second.status).toBe(409);
  });
});
