import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from "vite";

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
