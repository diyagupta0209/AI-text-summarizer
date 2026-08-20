import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = createApp(openai);

app.listen(port, () => {
  console.log(`AI Text Summarizer API listening on http://localhost:${port}`);
});
