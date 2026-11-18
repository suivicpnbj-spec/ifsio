import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement, /api/* est redirigé vers le serveur Express (port 3000).
// En production, servir le build statique via le backend ou un CDN, avec CORS_ORIGIN adapté.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
