// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
var buildId = (/* @__PURE__ */ new Date()).toISOString();
var vite_config_default = defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId)
  },
  plugins: [
    tanstackStart(),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
