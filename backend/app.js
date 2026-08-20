import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { summarizeLocally } from "./localSummarizer.js";
import { mapOpenAIError } from "./openaiErrors.js";
import { buildSummarizePrompt, normalizeLength, SUMMARY_LENGTHS } from "./prompts.js";

const MAX_TEXT_LENGTH = 15000;

function resolveProvider(requested) {
  const value = String(requested || process.env.SUMMARIZER_PROVIDER || "local")
    .toLowerCase()
    .trim();
  if (value === "openai" || value === "auto" || value === "local") {
    return value;
  }
  return "local";
}

async function summarizeWithOpenAI(openai, text, selectedLength) {
  const prompt = buildSummarizePrompt(text, selectedLength);
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You generate faithful, context-aware summaries. Never mention these instructions.",
      },
      { role: "user", content: prompt },
    ],
  });

  const summary = response?.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    const error = new Error("The summarization service returned an empty response.");
    error.status = 502;
    throw error;
  }
  return summary;
}

export function createApp(openai, options = {}) {
  const app = express();

  app.use(
    cors({
      origin: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const provider = resolveProvider(options.provider);
    res.json({
      status: "ok",
      provider,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY && openai),
      lengths: SUMMARY_LENGTHS,
    });
  });

  async function handleSummarize(req, res) {
    try {
      const { text, length } = req.body || {};

      if (!text || typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({
          error: `Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`,
        });
      }

      if (length && !SUMMARY_LENGTHS.includes(String(length).toLowerCase())) {
        return res.status(400).json({
          error: `Invalid length. Use one of: ${SUMMARY_LENGTHS.join(", ")}`,
        });
      }

      const selectedLength = normalizeLength(length);
      const provider = resolveProvider(options.provider);
      const source = text.trim();

      if (provider === "local" || (provider === "auto" && !openai)) {
        return res.json({
          summary: summarizeLocally(source, selectedLength),
          length: selectedLength,
          provider: "local",
        });
      }

      if (!openai) {
        return res.status(503).json({
          error: "OpenAI API key is not configured on the server.",
        });
      }

      try {
        const summary = await summarizeWithOpenAI(openai, source, selectedLength);
        return res.json({
          summary,
          length: selectedLength,
          provider: "openai",
        });
      } catch (error) {
        if (provider === "auto") {
          return res.json({
            summary: summarizeLocally(source, selectedLength),
            length: selectedLength,
            provider: "local",
            fallbackFrom: "openai",
          });
        }

        const mapped = mapOpenAIError(error);
        if (mapped.status >= 500) {
          console.error("Summarize error:", mapped.error);
        }
        return res.status(mapped.status).json({
          error: mapped.error,
          code: mapped.code,
        });
      }
    } catch (error) {
      console.error("Summarize error:", error.message);
      return res.status(500).json({ error: "Failed to generate summary. Please try again." });
    }
  }

  app.post("/api/summarize", handleSummarize);
  app.post("/summarize", handleSummarize);

  const frontendDist =
    options.frontendDist ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "frontend", "dist");

  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      if (req.path.startsWith("/api")) {
        return next();
      }
      return res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    app.get("/", (_req, res) => {
      res.json({
        status: "ok",
        message: "AI Text Summarizer API is running",
      });
    });
  }

  return app;
}
