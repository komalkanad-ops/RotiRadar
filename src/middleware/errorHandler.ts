import type { NextFunction, Request, Response } from "express";

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
    setImmediate(() => process.exit(1));
  }
}

export function installProcessCrashGuards() {
  process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
  process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));
}
