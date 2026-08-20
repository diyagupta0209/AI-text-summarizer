function isNetworkError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.name === "TypeError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("unable to fetch")
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

export async function requestSummary(text, length) {
  let lastNetworkError;

  for (const base of candidateBases()) {
    try {
      const response = await fetch(`${base}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, length }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 404) {
        lastNetworkError = new Error("Summarizer API route not found.");
        continue;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate a summary.");
      }

      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    lastNetworkError
      ? "Unable to reach the summarizer API. Start the backend with `npm start` in the backend folder, then generate again."
      : "Unable to generate a summary."
  );
}
