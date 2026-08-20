import { summarizeLocally } from "./localSummarizer.js";

function apiBase() {
  return String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

async function summarizeOnServer(text, length) {
  const base = apiBase();
  if (!base) return null;

  const response = await fetch(`${base}/api/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ text, length }),
  });

  const raw = await response.text();
  if (!raw.trim()) return null;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!response.ok || !data?.summary) return null;
  return data;
}

export async function requestSummary(text, length) {
  try {
    const remote = await summarizeOnServer(text, length);
    if (remote?.summary) return remote;
  } catch {
    // Render may be asleep or unreachable; use the in-browser summarizer.
  }

  return {
    summary: summarizeLocally(text, length),
    length,
    provider: "local",
  };
}
