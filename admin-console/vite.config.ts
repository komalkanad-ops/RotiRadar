import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The admin console is served as a sub-path of the marketing site: rotiradar.in/admin
// (Hostinger static build nests admin-console/dist into web/dist/admin — see web/package.json).
// `base` must match so built asset URLs resolve, and BrowserRouter uses the same `basename`.
export default defineConfig({
  base: "/admin/",
  plugins: [react()],
  server: { port: 5174 },
});
