import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(backendDir, ".env") });

import OpenAI from "openai";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const requestedProvider = String(process.env.SUMMARIZER_PROVIDER || "local").toLowerCase();
const openai =
  requestedProvider === "openai" && process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: 0,
      })
    : null;

if (requestedProvider === "openai" && !openai) {
  console.warn("SUMMARIZER_PROVIDER=openai but no OPENAI_API_KEY; using the free local summarizer.");
} else if (!openai) {
  console.log("Using the free local summarizer (OpenAI disabled).");
}

const app = createApp(openai);

app.listen(port, "0.0.0.0", () => {
  console.log(`AI Text Summarizer API listening on http://127.0.0.1:${port}`);
});
