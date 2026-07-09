import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { PORTS, origins } from "../../scripts/ports.mjs";

const adminPort = Number(process.env.AXIFORGE_ADMIN_PORT) || PORTS.admin;
const apiOrigin = process.env.AXIFORGE_API_ORIGIN ?? origins.api;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@axiforge/ui": path.resolve(__dirname, "../../packages/ui"),
    },
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
  server: {
    port: adminPort,
    strictPort: false,
    proxy: {
      "/api": { target: apiOrigin, changeOrigin: true },
    },
  },
});
