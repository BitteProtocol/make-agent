import { defineConfig } from "tsup";


export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "lightningcss"],
  minify: true,
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".js" : ".mjs",
    };
  },
  esbuildOptions(options) {
    options.assetNames = "[name]";
  },
  loader: {
    ".css": "copy",
  },
});