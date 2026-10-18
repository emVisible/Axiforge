import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { PORTS, origins } from "../../scripts/ports.mjs";

const repoRoot = path.resolve(__dirname, "../..");
// 端口与来源以 scripts/ports.mjs 为唯一真相源；env 只当本机/CI 的覆盖口，不再抄第二份数字。
const webPort = Number(process.env.AXIFORGE_WEB_PORT) || PORTS.web;
const apiOrigin = process.env.AXIFORGE_API_ORIGIN ?? origins.api;

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
      "@axiforge/editor-core": path.resolve(__dirname, "../../packages/editor-core/src"),
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
