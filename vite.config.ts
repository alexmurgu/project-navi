import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const buildId = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  preview: {
    allowedHosts: ["navi.aftermind.xyz"],
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "./ssr.tsx",
      },
    }),
    tsconfigPaths(),
    react(),
    tailwindcss(),
  ],
});
