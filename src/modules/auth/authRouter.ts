import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthClaims } from "../../middleware/auth.js";
import { requireJwtSecret } from "../../lib/jwtSecret.js";
import { authLimiter } from "../../lib/rateLimiters.js";

const JWT_SECRET = requireJwtSecret();

export const authRouter = Router();

const PHONE_RE = /^\+?[0-9]{10,15}$/;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function purposeFor(role: "customer" | "cook") {
  return role === "customer" ? "customer_login" : "cook_login";
}

function issueToken(claims: AuthClaims): string {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: "30d" });
}

// ─── Customer / cook phone+OTP ───────────────────────────────────────────────────

const requestOtpSchema = z.object({
  phone: z.string().regex(PHONE_RE, "phone must be 10-15 digits, optionally starting with +"),
  role: z.enum(["customer", "cook"]),
});

// POST /auth/otp/request — { phone, role } — issues a 6-digit OTP for a customer or cook login.
// No SMS gateway is configured yet (OTP_PROVIDER in .env.example is blank) — the code is logged
// server-side, and outside production also echoed back as `devCode` so the flow is testable
// without tailing logs. Wiring a real SMS provider is a Phase-1 follow-up (see NEXT-ACTIONS.md).
authRouter.post("/otp/request", authLimiter, async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { phone, role } = parsed.data;

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpChallenge.create({
    data: { phone, codeHash, purpose: purposeFor(role), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  console.log(`[OTP] ${role} ${phone} -> ${code}`);
  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
  res.json({ sent: true, devCode });
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(PHONE_RE),
  role: z.enum(["customer", "cook"]),
  code: z.string().length(6),
  name: z.string().min(1).max(120).optional(), // required for a cook's first login (registration)
});

// POST /auth/otp/verify — { phone, role, code, name? } — verifies the OTP and, on success, logs in
// an existing User/Cook or registers a new one (upsert-by-phone). A first-time cook must supply
// `name` (Cook.name is required, unlike User.name); if they didn't, the code is left unconsumed so
// they can resubmit with a name using the same still-valid code instead of requesting a new one.
authRouter.post("/otp/verify", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { phone, role, code, name } = parsed.data;

  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, purpose: purposeFor(role), consumedAt: null, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return res.status(401).json({ error: "No active code for this number — request a new one" });
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts — request a new code" });
  }

  const ok = await bcrypt.compare(code, challenge.codeHash);
  if (!ok) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return res.status(401).json({ error: "Incorrect code" });
  }

  if (role === "cook") {
    const existingCook = await prisma.cook.findUnique({ where: { phone } });
    if (!existingCook && !name) return res.status(400).json({ error: "name is required to register as a cook" });
  }

  await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });

  if (role === "cook") {
    const cook = await prisma.cook.upsert({ where: { phone }, create: { phone, name: name! }, update: {} });
    return res.json({ token: issueToken({ sub: cook.id, role: "COOK" }), role: "COOK", id: cook.id });
  }

  const user = await prisma.user.upsert({ where: { phone }, create: { phone, name }, update: {} });
  res.json({ token: issueToken({ sub: user.id, role: "CUSTOMER" }), role: "CUSTOMER", id: user.id });
});

// ─── Admin (email + password) ────────────────────────────────────────────────────

// POST /auth/admin/bootstrap — one-time: creates the first admin from ADMIN_BOOTSTRAP_EMAIL/
// PASSWORD if none exists yet. Safe to call repeatedly — no-ops (409) once any admin exists.
// `npm run seed` already does this for local/dev; this exists for the Hostinger deploy, whose
// `postinstall` runs migrate+build but not the seed script.
authRouter.post("/admin/bootstrap", async (_req, res) => {
  const existing = await prisma.adminUser.count();
  if (existing > 0) return res.status(409).json({ error: "Admin already bootstrapped" });

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!email || !password) return res.status(400).json({ error: "Set ADMIN_BOOTSTRAP_EMAIL/PASSWORD first" });

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.create({
    data: { email, passwordHash, name: "Owner", role: "SUPER_ADMIN" },
  });
  res.json({ id: admin.id, email: admin.email });
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/admin/login", authLimiter, async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });
  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.active) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const token = issueToken({ sub: admin.id, role: "ADMIN", adminRole: admin.role });
  res.json({ token, role: "ADMIN", adminRole: admin.role });
});

// ─── Session ──────────────────────────────────────────────────────────────────────

// GET /auth/me — whoever the bearer token identifies (customer or cook; requireAuth rejects admin
// tokens). Never returns another user's phone number — only the caller's own, off their verified
// claims.
authRouter.get("/me", requireAuth, async (req, res) => {
  const { sub, role } = req.auth!;

  if (role === "COOK") {
    const cook = await prisma.cook.findUnique({
      where: { id: sub },
      select: { id: true, phone: true, name: true, status: true },
    });
    if (!cook) return res.status(404).json({ error: "Not found" });
    return res.json({ role: "COOK", ...cook });
  }

  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { id: true, phone: true, name: true, email: true },
  });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ role: "CUSTOMER", ...user });
});
