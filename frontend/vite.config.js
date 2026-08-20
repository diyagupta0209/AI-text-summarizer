import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function jsonProxyError(proxy) {
  proxy.on("error", (error, _req, res) => {
    if (!res || typeof res.writeHead !== "function" || res.headersSent) {
      return;
    }

    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error:
          "Backend is not running on http://127.0.0.1:5000. Start it with npm start in the backend folder.",
        details: error.message,
      })
    );
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        configure: jsonProxyError,
      },
      "/summarize": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        configure: jsonProxyError,
      },
    },
  },
});
