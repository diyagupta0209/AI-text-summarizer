# AI Text Summarizer

Full-stack web app that turns long text into concise summaries using React, Express, and a free local summarizer. OpenAI remains an optional paid provider.

## Features

- Responsive React single-page UI with hooks and async API calls
- REST API for validation, prompt construction, optional OpenAI requests, and error handling
- Free extractive summarizer that works without billing
- Customizable summary length: short, medium, or long
- Copy-to-clipboard for generated summaries

## Project structure

```
backend/   Express API (port 5000)
frontend/   React + Vite app (port 5173)
```

## Setup

OpenAI is **not required**. The default provider is local and free.

1. Optional: create `backend/.env` if you want to change the provider or add a paid OpenAI key:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Keep `SUMMARIZER_PROVIDER=local` to avoid OpenAI charges.

2. Install dependencies and start both servers from the project root:

   ```bash
   cd backend && npm install && cd ../frontend && npm install && cd ..
   npm run dev
   ```

   Or start them separately:

   ```bash
   cd backend && npm install && npm start
   cd frontend && npm install && npm run dev
   ```

   The backend must be running on port 5000. If it is not, the browser shows “Failed to fetch” / unable to reach the API.

3. Open [http://localhost:5173](http://localhost:5173). The UI calls `/api/summarize` and falls back to `http://127.0.0.1:5000` if the Vite proxy is not used.

You can also build the UI and use one server:

```bash
cd frontend && npm install && npm run build
cd ../backend && npm start
```

Then open [http://localhost:5000](http://localhost:5000).

### Optional OpenAI

OpenAI chat completions are billed. A key without credits returns `insufficient_quota`. To use OpenAI after adding paid credit:

```
SUMMARIZER_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

`SUMMARIZER_PROVIDER=auto` is treated as local (free). OpenAI is used only when `SUMMARIZER_PROVIDER=openai`. If OpenAI fails (quota/rate limit), the API still returns a local summary instead of an error.

## API

`GET /api/health` — service status, active provider, and supported lengths.

`POST /api/summarize`

```json
{
  "text": "Long source text...",
  "length": "short"
}
```

`length` accepts `short`, `medium`, or `long`. Responses include `provider`: `local` or `openai`.

## Tests

```bash
cd backend
npm test
```
