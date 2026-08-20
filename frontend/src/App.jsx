import { useMemo, useState } from "react";
import { requestSummary } from "./api.js";
import "./App.css";

const LENGTHS = [
  { id: "short", label: "Short — 2-3 sentences" },
  { id: "medium", label: "Medium — one paragraph" },
  { id: "long", label: "Long — detailed overview" },
];

export default function App() {
  const [text, setText] = useState("");
  const [length, setLength] = useState("short");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const wordCount = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [text]);

  function handleClear() {
    setText("");
    setSummary("");
    setError("");
  }

  async function handleSummarize(event) {
    event.preventDefault();
    setError("");
    setSummary("");

    if (!text.trim()) {
      setError("Paste some text first.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestSummary(text, length);
      if (!result?.summary) {
        setError("Could not generate a summary from this text.");
        return;
      }
      setSummary(result.summary);
    } catch (err) {
      setError(err.message || "Could not generate a summary.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>TextGist</h1>
        <p>Turn long text into clear, concise summaries.</p>
      </header>

      <main className="panels">
        <section className="panel">
          <div className="panel-head">
            <h2>Input Text</h2>
            <span>
              {wordCount} words · {text.length} chars
            </span>
          </div>

          <form onSubmit={handleSummarize}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste the text you want summarized..."
              rows={14}
            />

            <label className="length-label" htmlFor="summary-length">
              Summary length
            </label>
            <select
              id="summary-length"
              value={length}
              onChange={(event) => setLength(event.target.value)}
            >
              {LENGTHS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="actions">
              <button type="button" className="clear" onClick={handleClear}>
                Clear
              </button>
              <button type="submit" className="generate" disabled={!text.trim() || isLoading}>
                {isLoading ? "Generating..." : "Generate Summary"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Summary</h2>
          {error ? <p className="alert">{error}</p> : null}
          <div className="output">{summary}</div>
        </section>
      </main>
    </div>
  );
}
