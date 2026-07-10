import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest/manifest.config";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
      "@background": path.resolve(import.meta.dirname, "src/background"),
      "@content": path.resolve(import.meta.dirname, "src/content"),
      "@offscreen": path.resolve(import.meta.dirname, "src/offscreen"),
      "@ui": path.resolve(import.meta.dirname, "src/ui"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
});
