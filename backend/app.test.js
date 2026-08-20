import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.js";
import { mapOpenAIError } from "./openaiErrors.js";
import { buildSummarizePrompt, normalizeLength } from "./prompts.js";

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

describe("summarize API", () => {
  let server;
  let baseUrl;

  before(async () => {
    process.env.OPENAI_API_KEY = "test-key";
    ({ server, baseUrl } = await listen(createApp(mockOpenAI())));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("reports health", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
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

  it("returns 503 when OpenAI is not configured", async () => {
    const unconfigured = await listen(createApp(null));
    try {
      const response = await fetch(`${unconfigured.baseUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Some source text.", length: "short" }),
      });
      assert.equal(response.status, 503);
    } finally {
      await new Promise((resolve) => unconfigured.server.close(resolve));
    }
  });

  it("returns a summary for valid input", async () => {
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
  });

  it("maps OpenAI quota errors instead of calling them rate limits", async () => {
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
    const quota = await listen(createApp(quotaClient));
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
