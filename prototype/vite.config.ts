import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/flavordb": {
        target: "http://192.168.1.92:9208",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flavordb/, "/flavordb"),
      },
    },
  },
});
