import { summarizeLocally } from "./localSummarizer.js";

async function parseApiBody(response) {
  const raw = await response.text();
  if (!raw || !raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function tryRemoteSummary(text, length) {
  const paths = ["/api/summarize", "/summarize"];

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text, length }),
      });
      const data = await parseApiBody(response);
      if (response.ok && data?.summary) {
        return data;
      }
    } catch {
      // Backend/proxy may be down; use the in-browser summarizer.
    }
  }

  return null;
}

export async function requestSummary(text, length) {
  const remote = await tryRemoteSummary(text, length);
  if (remote?.summary) {
    return remote;
  }

  return {
    summary: summarizeLocally(text, length),
    length,
    provider: "local",
  };
}
