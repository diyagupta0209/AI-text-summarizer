import { useState } from "react";
import { summarizeLocally } from "./localSummarizer.js";
import "./App.css";

const LENGTHS = [
  { id: "short", label: "Short", hint: "2–3 sentences" },
  { id: "medium", label: "Medium", hint: "One paragraph" },
  { id: "long", label: "Long", hint: "Detailed overview" },
];

const SAMPLE_TEXT = `Artificial intelligence has rapidly changed how people work with large amounts of information. Instead of reading every paragraph in a report, users can now request a concise overview that preserves the original meaning, names, figures, and conclusions. A good summarizer should stay faithful to the source, avoid inventing facts, and let the reader choose how long the result should be. This project demonstrates that workflow with a React frontend and an Express API that constructs prompts and calls the OpenAI API.`;

export default function App() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("short");
  const [summary, setSummary] = useState("");
  const [provider, setProvider] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const characterCount = text.length;
  const canSubmit = text.trim().length > 0;

  function handleSummarize(event) {
    event.preventDefault();
    setError("");
    setCopied(false);
    setSummary("");
    setProvider("");

    const nextSummary = summarizeLocally(text, length);
    if (!nextSummary) {
      setError("Could not generate a summary from this text.");
      return;
    }

    setSummary(nextSummary);
    setProvider("local");
  }

  async function copySummary() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">React · Express · Free local summarizer</p>
        <h1>AI Text Summarizer</h1>
        <p className="lede">
          Paste a long article, notes, or report and generate a concise summary
          with a length you control. Summaries run on a free local engine. OpenAI
          is turned off, so you will not see paid-API rate-limit errors.
        </p>
      </header>

      <main className="layout">
        <form className="card" onSubmit={handleSummarize}>
          <div className="card-head">
            <h2>Source text</h2>
            <button
              type="button"
              className="ghost"
              onClick={() => setText(SAMPLE_TEXT)}
            >
              Load sample
            </button>
          </div>

          <label className="sr-only" htmlFor="source-text">
            Text to summarize
          </label>
          <textarea
            id="source-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste or type the text you want summarized..."
            rows={12}
          />

          <div className="meta-row">
            <span>{characterCount.toLocaleString()} characters</span>
            <span>Max 15,000</span>
          </div>

          <fieldset className="lengths">
            <legend>Summary length</legend>
            <div className="length-grid">
              {LENGTHS.map((option) => (
                <label
                  key={option.id}
                  className={length === option.id ? "chip selected" : "chip"}
                >
                  <input
                    type="radio"
                    name="length"
                    value={option.id}
                    checked={length === option.id}
                    onChange={() => setLength(option.id)}
                  />
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="primary" type="submit" disabled={!canSubmit}>
            {isLoading ? "Generating summary..." : "Generate summary"}
          </button>
        </form>

        <section className="card result" aria-live="polite">
          <div className="card-head">
            <h2>Summary</h2>
            <button
              type="button"
              className="ghost"
              onClick={copySummary}
              disabled={!summary}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {error ? <p className="alert">{error}</p> : null}

          {summary ? (
            <>
              {provider ? (
                <p className="provider">
                  {provider === "openai"
                    ? "Generated with OpenAI"
                    : "Generated with the free local summarizer"}
                </p>
              ) : null}
              <p className="summary-text">{summary}</p>
            </>
          ) : (
            <p className="placeholder">
              Your generated summary will appear here after you submit text.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
