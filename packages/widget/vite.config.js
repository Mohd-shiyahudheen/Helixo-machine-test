import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: "src/widget.jsx",
      name: "HelixoCountdown",
      fileName: () => "countdown.js",
      formats: ["iife"],
    },
    outDir: "dist",
    minify: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "countdown.js",
      },
    },
    target: "es2015",
  },
});
