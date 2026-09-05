import type { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";

/**
 * Final error handler. A failed query must return a clean error to that one request, never crash
 * the process. Common Prisma errors get a sensible HTTP status.
 *
 * A caught `PrismaClientRustPanicError` is the one case where we deliberately exit: that panic
 * leaves the native engine permanently broken for the rest of the process's life, and Hostinger's
 * supervisor restarts a crashed process in under a second. See CLAUDE.md #4.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const e = err as { code?: string; name?: string; message?: string };
  console.error(`Request error [${req.method} ${req.originalUrl}]:`, err);

  if (!res.headersSent) {
    if (e.code === "P2025") res.status(404).json({ error: "Not found" });
    else if (e.code === "P2002") res.status(409).json({ error: "That already exists" });
    else if (e.name === "PrismaClientValidationError") res.status(400).json({ error: "Invalid request" });
    else if (e.name === "ZodError") res.status(400).json({ error: "Invalid request" });
    else res.status(500).json({ error: "Something went wrong processing that request" });
  }

  if (e.name === "PrismaClientRustPanicError") {
    console.error("Unrecoverable Prisma engine panic — exiting so the platform starts a fresh process");
    // Explicit capture, not relying solely on Sentry.setupExpressErrorHandler's automatic hook —
    // this exact panic went unreported to Sentry twice in a row on the live server (once with a
    // bare process.exit() right after, once after adding a Sentry.close() flush first), so either
    // the automatic handler isn't capturing this specific error shape or something about a Rust
    // panic crossing the N-API boundary doesn't behave like a normal thrown JS Error. Capture and
    // flush explicitly here as a second, independent path — Sentry dedupes, so capturing twice if
    // the automatic hook *was* working all along is harmless.
    Sentry.captureException(err);
    Sentry.close(3000).finally(() => process.exit(1));
  }
}

export function installProcessCrashGuards() {
  process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
  process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));
}
