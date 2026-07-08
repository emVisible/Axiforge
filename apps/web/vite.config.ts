import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
