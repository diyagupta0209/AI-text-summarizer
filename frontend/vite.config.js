import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localSummarizerPlugin } from "./vite-plugin-summarizer.js";

const base = process.env.GITHUB_PAGES === "true" ? "/AI-text-summarizer/" : "/";

export default defineConfig({
  base,
  plugins: [react(), localSummarizerPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
