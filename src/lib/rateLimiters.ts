import rateLimit from "express-rate-limit";

// Stricter limiter for the auth surface (OTP request, admin login) — worth protecting specifically
// against brute-force/OTP-spam, where the app-wide 300/15min limiter (app.ts) would still allow a
// meaningful attack. OTP *verification* isn't rate-limited here — it already has its own per-code
// attempt cap at the data level (OtpChallenge.attempts, enforced in authRouter).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a few minutes and try again" },
});
