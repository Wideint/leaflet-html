import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.js"),
      name: "leaflet-html",
      fileName: "leaflet-html",
    },
  },
  test: {
    includeSource: ["src/**/*.{js,ts}"],
    coverage: {
      exclude: ["docs"],
    },
  },
});
