import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  build: {
    outDir: "dist/webview",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: "src/webview/main.ts",
      output: {
        entryFileNames: "webview.js",
        assetFileNames: (assetInfo) => (assetInfo.name?.endsWith(".css") ? "webview.css" : "[name][extname]")
      }
    }
  }
});
