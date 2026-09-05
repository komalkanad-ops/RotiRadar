import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

// Rust-free (Prisma 7 + a driver adapter): no query-engine binary, so no
// `PrismaClientRustPanicError: PANIC: timer has gone away` — that panic came from the Rust
// engine's own embedded async runtime and happened on 100% of queries on Hostinger's Node.js
// hosting, confirmed across repeated fresh restarts (see CLAUDE.md "Known-fragile Hostinger
// things" #1). The adapter talks to MySQL via a plain JS driver instead.
//
// Client construction is still deferred to first use, same rationale as before the migration off
// the Rust engine: Hostinger's Node.js hosting forks worker processes from a pre-loaded parent,
// and anything that opens sockets/timers at module-import time risks being inherited dead by the
// child. Cheap to keep even though the original failure mode (specific to the Rust engine) is gone.
let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!client) {
    const url = new URL(requireDatabaseUrl());
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      connectionLimit: 5,
    });
    client = new PrismaClient({ adapter });
  }
  return client;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient() as object, prop, receiver);
  },
});
