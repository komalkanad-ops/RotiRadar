import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI-only config (generate / migrate / studio) — separate from the runtime driver-adapter
// connection in src/lib/prisma.ts, per Prisma 7's split between the two. Same DATABASE_URL either
// way, just two different consumers of it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
