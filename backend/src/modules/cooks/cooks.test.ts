import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";

// A fake, obviously-test-only cook so a run against a real database never mixes with genuine
// data. Created directly via Prisma (not through /auth/otp) to keep this file focused on the
// cooks endpoints — the OTP registration path is already covered by auth.test.ts.
const COOK_PHONE = "+911000000009";
const JWT_SECRET = requireJwtSecret();

let cookId: string;
let cookToken: string;
let adminToken: string;

describe("cooks", () => {
  beforeAll(async () => {
    const cook = await prisma.cook.create({ data: { phone: COOK_PHONE, name: "Test Cook" } });
    cookId = cook.id;
    cookToken = jwt.sign({ sub: cookId, role: "COOK" }, JWT_SECRET, { expiresIn: "1h" });
    // No throwaway admin needed — admin/login is covered in auth.test.ts. requireAdmin only checks
    // the token's claims, so a fake sub is fine here as long as no route dereferences an admin row.
    adminToken = jwt.sign({ sub: "vitest-admin", role: "ADMIN", adminRole: "SUPER_ADMIN" }, JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {
    await prisma.cookAvailability.deleteMany({ where: { cookId } });
    await prisma.cookServiceOffering.deleteMany({ where: { cookId } });
    await prisma.cookDocument.deleteMany({ where: { cookId } });
    await prisma.cook.deleteMany({ where: { phone: COOK_PHONE } });
  });

  it("rejects unauthenticated access to /cooks/me", async () => {
    const res = await request(app).get("/cooks/me");
    expect(res.status).toBe(401);
  });

  it("returns the cook's own profile", async () => {
    const res = await request(app).get("/cooks/me").set("Authorization", `Bearer ${cookToken}`);
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe(COOK_PHONE);
    expect(res.body.status).toBe("PENDING_REVIEW");
    expect(res.body.documents).toEqual([]);
  });

  it("updates the cook's profile, round-tripping array fields through CSV storage", async () => {
    const res = await request(app)
      .patch("/cooks/me")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ bio: "10 years of home cooking", languages: ["Hindi", "Kannada"], radiusKm: 8 });
    expect(res.status).toBe(200);
    expect(res.body.languages).toEqual(["Hindi", "Kannada"]);
    expect(res.body.radiusKm).toBe(8);
  });

  it("uploads a KYC document and lists it", async () => {
    const upload = await request(app)
      .post("/cooks/me/documents")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ type: "AADHAAR", fileUrl: "https://example.com/aadhaar.jpg" });
    expect(upload.status).toBe(201);
    expect(upload.body.status).toBe("UPLOADED");

    const list = await request(app).get("/cooks/me/documents").set("Authorization", `Bearer ${cookToken}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it("creates and updates a service offering (unique per tier)", async () => {
    const create = await request(app)
      .post("/cooks/me/offerings")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ tier: "BASIC", ratePaise: 19900, cuisines: ["North Indian"] });
    expect(create.status).toBe(200);
    expect(create.body.cuisines).toEqual(["North Indian"]);

    const update = await request(app)
      .post("/cooks/me/offerings")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ tier: "BASIC", ratePaise: 24900 });
    expect(update.status).toBe(200);
    expect(update.body.ratePaise).toBe(24900);

    const list = await request(app).get("/cooks/me/offerings").set("Authorization", `Bearer ${cookToken}`);
    expect(list.body).toHaveLength(1);
  });

  it("rejects an availability slot where endMin isn't after startMin", async () => {
    const res = await request(app)
      .post("/cooks/me/availability")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ slots: [{ weekday: 1, startMin: 600, endMin: 600 }] });
    expect(res.status).toBe(400);
  });

  it("replaces the weekly availability schedule", async () => {
    const first = await request(app)
      .post("/cooks/me/availability")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ slots: [{ weekday: 1, startMin: 540, endMin: 720 }] });
    expect(first.status).toBe(200);
    expect(first.body).toHaveLength(1);

    // A second call replaces, not appends.
    const second = await request(app)
      .post("/cooks/me/availability")
      .set("Authorization", `Bearer ${cookToken}`)
      .send({ slots: [{ weekday: 2, startMin: 600, endMin: 780 }] });
    expect(second.status).toBe(200);
    expect(second.body).toHaveLength(1);
    expect(second.body[0].weekday).toBe(2);
  });

  it("blocks a non-admin from the KYC endpoints", async () => {
    const res = await request(app).get("/cooks").set("Authorization", `Bearer ${cookToken}`);
    expect(res.status).toBe(401);
  });

  it("lets an admin list, view, and approve a cook through KYC", async () => {
    const list = await request(app)
      .get("/cooks?status=PENDING_REVIEW")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((c: { id: string }) => c.id === cookId)).toBe(true);

    const detail = await request(app).get(`/cooks/${cookId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.documents).toHaveLength(1);

    const docId = detail.body.documents[0].id;
    const reviewed = await request(app)
      .patch(`/cooks/${cookId}/documents/${docId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "VERIFIED" });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.status).toBe("VERIFIED");
    expect(reviewed.body.reviewedBy).toBe("vitest-admin");

    const approved = await request(app)
      .patch(`/cooks/${cookId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "ACTIVE" });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("ACTIVE");
  });
});
