import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // allow external access
    port: 5173,
    allowedHosts: [
      ".csb.app",
      "rzx833-5173.csb.app", // allow all CodeSandbox preview URLs
    ],
  },

  preview: {
    host: true,
    port: 4173,
  },
});
