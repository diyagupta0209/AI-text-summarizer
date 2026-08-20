const LENGTH_INSTRUCTIONS = {
  short:
    "Write a concise 2–3 sentence summary that captures only the core idea. Do not add commentary or bullet points.",
  medium:
    "Write a balanced paragraph summary (4–6 sentences) covering the main points and important supporting details.",
  long: "Write a detailed multi-paragraph summary covering the main ideas, supporting details, and conclusions. Stay faithful to the source.",
};

export const SUMMARY_LENGTHS = Object.keys(LENGTH_INSTRUCTIONS);

export function normalizeLength(length) {
  const value = String(length || "short").toLowerCase().trim();
  return LENGTH_INSTRUCTIONS[value] ? value : "short";
}

export function buildSummarizePrompt(text, length) {
  const selected = normalizeLength(length);
  const instruction = LENGTH_INSTRUCTIONS[selected];

  return [
    "You are a precise text summarization assistant.",
    "Summarize the user's text using the requested length.",
    "Preserve meaning, names, numbers, and key facts. Do not invent information.",
    `Length instruction: ${instruction}`,
    "",
    "Text to summarize:",
    text,
  ].join("\n");
}
