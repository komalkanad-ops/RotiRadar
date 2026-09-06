import { PrismaClient } from "@prisma/client";

// Lazily constructed — the native engine's threads only start on first real query, not at
// module-import time. The real cause of `PrismaClientRustPanicError: PANIC: timer has gone away`
// on Hostinger turned out to be thread-pool exhaustion (the shared server reports ~64 CPUs, Tokio
// spawns a worker per "CPU", ulimit blows) — fixed by `TOKIO_WORKER_THREADS`/`UV_THREADPOOL_SIZE`
// in the env, not by this lazy pattern. Keeping lazy anyway: it's cheap and avoids any
// import-time socket/timer work in Hostinger's forked-worker model. See CLAUDE.md "Known-fragile" #1.
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
