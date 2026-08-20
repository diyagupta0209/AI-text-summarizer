import { summarizeLocally } from "./src/localSummarizer.js";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isSummarizePath(url = "") {
  const path = url.split("?")[0];
  return path === "/summarize" || path === "/api/summarize";
}

export function localSummarizerPlugin() {
  return {
    name: "local-summarizer-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.method === "GET" && req.url?.split("?")[0] === "/api/health") {
            return sendJson(res, 200, {
              status: "ok",
              provider: "local",
              lengths: ["short", "medium", "long"],
            });
          }

          if (!isSummarizePath(req.url || "")) {
            return next();
          }

          if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method !== "POST") {
            return sendJson(res, 405, { error: "Use POST to generate a summary." });
          }

          const raw = await readBody(req);
          const payload = raw ? JSON.parse(raw) : {};
          const text = String(payload.text || "").trim();
          const length = payload.length || "short";

          if (!text) {
            return sendJson(res, 400, { error: "Text is required" });
          }

          return sendJson(res, 200, {
            summary: summarizeLocally(text, length),
            length,
            provider: "local",
          });
        } catch (error) {
          return sendJson(res, 500, {
            error: error.message || "Failed to generate summary.",
          });
        }
      });
    },
  };
}
