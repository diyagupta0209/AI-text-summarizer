import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.js";
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
});
