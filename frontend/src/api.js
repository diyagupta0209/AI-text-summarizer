function isRetryableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.name === "TypeError" ||
    error?.retryable === true ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("unable to fetch") ||
    message.includes("unexpected end of json") ||
    message.includes("unexpected end of input")
  );
}

function candidateBases() {
  const configured = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const bases = [configured, ""];

  if (typeof window !== "undefined" && window.location.protocol !== "https:") {
    bases.push("http://127.0.0.1:5000");
    bases.push("http://localhost:5000");
  }

  return [...new Set(bases.filter((base) => base !== undefined && base !== null))];
}

export async function parseApiBody(response) {
  let raw = "";
  try {
    raw = await response.text();
  } catch {
    const error = new Error("The API returned an unreadable response.");
    error.retryable = true;
    throw error;
  }

  if (!raw || !raw.trim()) {
    const error = new Error("The API returned an empty response.");
    error.retryable = true;
    throw error;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(
      "The API did not return JSON. Start the backend with `npm start` in the backend folder."
    );
    error.retryable = true;
    throw error;
  }
}

export async function requestSummary(text, length) {
  let lastRetryableError;

  for (const base of candidateBases()) {
    try {
      const response = await fetch(`${base}/api/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text, length }),
      });

      const data = await parseApiBody(response);

      if (response.status === 404 || response.status === 502 || response.status === 504) {
        lastRetryableError = new Error(data.error || "Summarizer API is unavailable.");
        continue;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate a summary.");
      }

      if (!data.summary) {
        lastRetryableError = new Error("The API returned an empty summary.");
        continue;
      }

      return data;
    } catch (error) {
      if (isRetryableError(error)) {
        lastRetryableError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    lastRetryableError
      ? "Unable to reach the summarizer API. Start the backend with `npm start` in the backend folder, keep it running, then generate again."
      : "Unable to generate a summary."
  );
}
