import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn("OPENAI_API_KEY is not set. The API will start, but /api/summarize will return 503.");
}

const app = createApp(openai);

app.listen(port, () => {
  console.log(`AI Text Summarizer API listening on http://localhost:${port}`);
});
