import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import OpenAI from "openai";

console.log("API KEY:", process.env.OPENAI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// Summarize route
app.post("/summarize", async (req, res) => {
  console.log("🔥 HIT /summarize");
  console.log("BODY:", req.body);

  try {
    const { text, length } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required" });
    }

    const prompt = `Summarize the following text in a ${length || "short"} way:\n\n${text}`;

    console.log("⏳ Calling OpenAI...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("✅ OpenAI responded");

    const summary = response.choices[0].