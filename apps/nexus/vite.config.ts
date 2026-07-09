import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { PORTS } from "../../scripts/ports.mjs";

const devPort = Number(process.env.AXIFORGE_NEXUS_PORT ?? process.env.NEXUS_DEV_PORT) || PORTS.nexus;

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    server: {
      port: devPort,
      strictPort: false,
    },
    base: "./",
  };
});
