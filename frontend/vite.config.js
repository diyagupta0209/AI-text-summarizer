import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localSummarizerPlugin } from "./vite-plugin-summarizer.js";

export default defineConfig({
  plugins: [react(), localSummarizerPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
