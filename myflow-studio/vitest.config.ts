import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
      "@background": path.resolve(import.meta.dirname, "src/background"),
      "@content": path.resolve(import.meta.dirname, "src/content"),
      "@offscreen": path.resolve(import.meta.dirname, "src/offscreen"),
      "@ui": path.resolve(import.meta.dirname, "src/ui"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
});
