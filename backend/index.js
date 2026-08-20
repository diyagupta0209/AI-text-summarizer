import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(backendDir, ".env") });

import OpenAI from "openai";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
    })
  : null;

if (!openai) {
  console.warn("OPENAI_API_KEY is not set. The API will start, but /api/summarize will return 503.");
}

const app = createApp(openai);

app.listen(port, () => {
  console.log(`AI Text Summarizer API listening on http://localhost:${port}`);
});
