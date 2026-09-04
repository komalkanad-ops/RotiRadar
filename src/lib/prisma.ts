import { PrismaClient } from "@prisma/client";

// Lazily constructed. Hostinger's Node.js hosting forks worker processes from a pre-loaded parent;
// constructing PrismaClient eagerly at module-import time triggers
// `PrismaClientRustPanicError: PANIC: timer has gone away` on 100% of fresh processes (a Rust
// async-runtime timer thread started pre-fork, inherited dead by the child). Deferring construction
// to the first real query means the native engine's threads only start inside a forked worker.
// See CLAUDE.md -> "Known-fragile Hostinger things" #1.
let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!client) client = new PrismaClient();
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient() as object, prop, receiver);
  },
});
