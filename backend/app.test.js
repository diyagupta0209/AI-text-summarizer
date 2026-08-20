import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.js";
import { summarizeLocally } from "./localSummarizer.js";
import { mapOpenAIError } from "./openaiErrors.js";
import { buildSummarizePrompt, normalizeLength } from "./prompts.js";

const SAMPLE = `Artificial intelligence has rapidly changed how people work with large amounts of information. Instead of reading every paragraph in a report, users can now request a concise overview that preserves the original meaning, names, figures, and conclusions. A good summarizer should stay faithful to the source, avoid inventing facts, and let the reader choose how long the result should be. This project demonstrates that workflow with a React frontend and an Express API. Extra filler sentences exist only to make ranking meaningful. Frequency words such as summarizer and overview should influence extractive scoring.`;

function mockOpenAI(content = "This is a generated summary.") {
  return {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content } }],
        }),
      },
    },
  };
}

async function listen(app) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

describe("prompt construction", () => {
  it("defaults unknown lengths to short", () => {
    assert.equal(normalizeLength("tiny"), "short");
    assert.equal(normalizeLength("LONG"), "long");
  });

  it("includes the source text and length instruction", () => {
    const prompt = buildSummarizePrompt("Photosynthesis converts light into energy.", "medium");
    assert.match(prompt, /Photosynthesis converts light into energy/);
    assert.match(prompt, /4–6 sentences/);
  });
});

describe("local summarizer", () => {
  it("returns fewer sentences than the source", () => {
    const summary = summarizeLocally(SAMPLE, "short");
    const sourceCount = SAMPLE.split(/[.!?]+/).filter((part) => part.trim()).length;
    const summaryCount = summary.split(/[.!?]+/).filter((part) => part.trim()).length;
    assert.ok(summaryCount < sourceCount);
    assert.match(summary, /summarizer|overview|Artificial intelligence/i);
  });
});

describe("summarize API", () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.OPENAI_API_KEY = "test-key";
    ({ server, baseUrl } = await listen(createApp(mockOpenAI(), { provider: "openai" })));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("reports health", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.provider, "openai");
    assert.deepEqual(body.lengths, ["short", "medium", "long"]);
  });

  it("rejects empty text", async () => {
    const response = await fetch(`${baseUrl}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   ", length: "short" }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error, "Text is required");
  });

  it("rejects invalid length", async () => {
    const response = await fetch(`${baseUrl}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "A paragraph of source text.", length: "huge" }),
    });
    assert.equal(response.status, 400);
  });

  it("summarizes locally without OpenAI", async () => {
    const local = await listen(createApp(null, { provider: "local" }));
    try {
      const response = await fetch(`${local.baseUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: SAMPLE, length: "short" }),
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.provider, "local");
      assert.ok(body.summary.length > 0);
      assert.ok(body.summary.length < SAMPLE.length);
    } finally {
      await new Promise((resolve) => local.server.close(resolve));
    }
  });

  it("returns an OpenAI summary when that provider is selected", async () => {
    const response = await fetch(`${baseUrl}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Large language models can summarize long documents into shorter text.",
        length: "short",
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.summary, "This is a generated summary.");
    assert.equal(body.length, "short");
    assert.equal(body.provider, "openai");
  });

  it("also accepts POST /summarize", async () => {
    const response = await fetch(`${baseUrl}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: SAMPLE, length: "short" }),
    });
    assert.equal(response.status, 200);
  });

  it("falls back to local summaries when OpenAI quota is exhausted", async () => {
    const quotaClient = {
      chat: {
        completions: {
          create: async () => {
            const error = new Error("You exceeded your current quota");
            error.status = 429;
            error.code = "insufficient_quota";
            error.type = "insufficient_quota";
            throw error;
          },
        },
      },
    };
    const quota = await listen(createApp(quotaClient, { provider: "auto" }));
    try {
      const response = await fetch(`${quota.baseUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: SAMPLE, length: "short" }),
      });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.provider, "local");
      assert.equal(body.fallbackFrom, "openai");
    } finally {
      await new Promise((resolve) => quota.server.close(resolve));
    }
  });

  it("maps OpenAI quota errors when OpenAI is required", async () => {
    const quotaClient = {
      chat: {
        completions: {
          create: async () => {
            const error = new Error("You exceeded your current quota");
            error.status = 429;
            error.code = "insufficient_quota";
            error.type = "insufficient_quota";
            throw error;
          },
        },
      },
    };
    const quota = await listen(createApp(quotaClient, { provider: "openai" }));
    try {
      const response = await fetch(`${quota.baseUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Some source text.", length: "short" }),
      });
      assert.equal(response.status, 402);
      const body = await response.json();
      assert.equal(body.code, "insufficient_quota");
      assert.match(body.error, /billing limit/i);
    } finally {
      await new Promise((resolve) => quota.server.close(resolve));
    }
  });
});

describe("OpenAI error mapping", () => {
  it("keeps true rate limits as 429", () => {
    const mapped = mapOpenAIError({
      status: 429,
      code: "rate_limit_exceeded",
      message: "Rate limit reached",
    });
    assert.equal(mapped.status, 429);
    assert.equal(mapped.code, "rate_limit_exceeded");
  });
});
