# AI Text Summarizer

Full-stack web app that turns long text into concise, context-aware summaries using React, Express, and the OpenAI API.

## Features

- Responsive React single-page UI with hooks and async API calls
- REST API for validation, prompt construction, OpenAI requests, and error handling
- Customizable summary length: short, medium, or long
- Copy-to-clipboard for generated summaries

## Project structure

```
backend/   Express API (port 5000)
frontend/   React + Vite app (port 5173)
```

## Setup

1. Create `backend/.env` from the example file and add your OpenAI key:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Install and start the API:

   ```bash
   cd backend
   npm install
   npm start
   ```

3. In a second terminal, install and start the UI:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to the Express server.

## API

`GET /api/health` — service status and supported lengths.

`POST /api/summarize`

```json
{
  "text": "Long source text...",
  "length": "short"
}
```

`length` accepts `short`, `medium`, or `long`.

## Tests

```bash
cd backend
npm test
```
