import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Development server. Requests to /api/v1 are forwarded to VITE_DEV_API_TARGET
// (see .env), so the browser treats the app and the API as the same site.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 8080,
      proxy: {
        "/api/v1": {
          target: env.VITE_DEV_API_TARGET || "http://127.0.0.1:4000",
          changeOrigin: true, // address requests to UAT's own host name, not "localhost"
          secure: true,       // UAT has a valid HTTPS certificate
        },
      },
    },
  };
});