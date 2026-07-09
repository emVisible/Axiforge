import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const repoRoot = path.resolve(__dirname, "../..");
const webPort = Number(process.env.AXIFORGE_WEB_PORT) || 5174;
const apiOrigin = process.env.AXIFORGE_API_ORIGIN ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["react-markdown", "remark-gfm"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@axiforge/ui": path.resolve(__dirname, "../../packages/ui"),
      "@axiforge/core": path.resolve(__dirname, "../../packages/core/src"),
      "@axiforge/axs": path.resolve(__dirname, "../../packages/axs/src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/reactflow") ||
            id.includes("node_modules/@reactflow")
          ) {
            return "vendor-reactflow";
          }
          if (id.includes("node_modules/@codemirror")) {
            return "vendor-codemirror";
          }
        },
      },
    },
  },
  server: {
    port: webPort,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
    proxy: {
      "/api": {
        target: apiOrigin,
        changeOrigin: true,
      },
      "/uploads": {
        target: apiOrigin,
        changeOrigin: true,
      },
    },
  },
});
