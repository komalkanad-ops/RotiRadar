import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every spec runs against one real MySQL database (the live Hostinger DB when run from a dev
    // machine, a throwaway mysql service in CI). Running spec files concurrently makes ~10
    // connections hammer it at once and produces spurious foreign-key/connection races between
    // unrelated suites. The suites are fast (<1min total serial) — just run them one file at a time.
    fileParallelism: false,
  },
});
