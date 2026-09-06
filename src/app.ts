import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";

import { prisma } from "./lib/prisma.js";
import { errorHandler, installProcessCrashGuards } from "./middleware/errorHandler.js";
import { servicesRouter } from "./modules/services/servicesRouter.js";
import { authRouter } from "./modules/auth/authRouter.js";
import { cooksRouter } from "./modules/cooks/cooksRouter.js";
import { bookingsRouter } from "./modules/bookings/bookingsRouter.js";
import { addressesRouter } from "./modules/addresses/addressesRouter.js";
import { chatRouter } from "./modules/chat/chatRouter.js";
import { paymentsRouter } from "./modules/payments/paymentsRouter.js";
import { adminRouter } from "./modules/admin/adminRouter.js";
import { ratingsRouter } from "./modules/ratings/ratingsRouter.js";
import { reportsRouter } from "./modules/reports/reportsRouter.js";
import { disputesRouter } from "./modules/disputes/disputesRouter.js";

// Just the Express app — no listen(), no schedulers. Separated from server.ts so tests can import
// and exercise it with Supertest without opening a socket.
export const app = express();

// Hostinger's edge sits in front of this process — trust exactly one proxy hop so the rate
// limiter keys on the real client IP.
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 15552000, includeSubDomains: true },
  }),
);

// CORS — called cross-origin only by the first-party static sites. Native apps and the Razorpay
// webhook send no Origin and are allowed through.
const ALLOWED = [/^https:\/\/([a-z0-9-]+\.)?rotiradar\.in$/, /^http:\/\/localhost(:\d+)?$/];
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || ALLOWED.some((re) => re.test(origin))),
    credentials: true,
  }),
);

// Stash the raw body for Razorpay webhook HMAC verification (Phase 1).
app.use(express.json({ limit: "1mb", verify: (req, _res, buf) => ((req as { rawBody?: string }).rawBody = buf.toString()) }));

// Health probes before the limiter so an uptime monitor can't 429 itself.
app.get("/", (_req, res) => res.json({ ok: true, service: "rotiradar-api" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "rotiradar-api" }));
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up", uptimeS: Math.round(process.uptime()) });
  } catch (err) {
    // `code`/`name` only — never the error's own `message`, which for a Prisma connection error
    // can echo back the connection string (i.e. the DB password) verbatim.
    const e = err as { code?: string; name?: string };
    res.status(503).json({ ok: false, db: "down", code: e.code, name: e.name });
  }
});

app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// Domain modules. One line each; add new ones here (see .claude/commands/new-api-module.md).
app.use("/services", servicesRouter);
app.use("/auth", authRouter);
app.use("/cooks", cooksRouter);
app.use("/bookings", bookingsRouter);
app.use("/addresses", addressesRouter);
app.use("/chat", chatRouter);
app.use("/payments", paymentsRouter);
app.use("/admin", adminRouter);
app.use("/ratings", ratingsRouter);
app.use("/reports", reportsRouter);
app.use("/disputes", disputesRouter);

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export { installProcessCrashGuards };
