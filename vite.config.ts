import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

const buildId = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  // Native in Vite 8: resolves the "@/..." aliases from tsconfig.json.
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "4173", 10),
    allowedHosts: ["navi.aftermind.xyz"],
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "./ssr.tsx",
      },
    }),
    react(),
    tailwindcss(),
  ],
});
