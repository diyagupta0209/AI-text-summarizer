import { summarizeLocally } from "./localSummarizer.js";

export function requestSummary(text, length) {
  return {
    summary: summarizeLocally(text, length),
    length,
    provider: "local",
  };
}
