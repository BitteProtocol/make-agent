import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  build: {
    emptyOutDir: true,
  },
});
