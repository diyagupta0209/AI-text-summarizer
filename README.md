# TextGist

React text summarization app. Summaries run in the browser. Express/OpenAI are optional.

## Local setup

```powershell
git checkout main
git pull origin main
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Deploy on Vercel (recommended)

1. Go to [https://vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **diyagupta0209/AI-text-summarizer**.
3. Leave the root directory as the repository root. `vercel.json` already builds `frontend/`.
4. Click **Deploy**. Do not add an OpenAI key.

Your site will be something like `https://ai-text-summarizer.vercel.app`.

## Deploy on Netlify

1. Go to [https://app.netlify.com/start](https://app.netlify.com/start) and sign in with GitHub.
2. Import **diyagupta0209/AI-text-summarizer**.
3. Netlify will read `netlify.toml` (build `frontend`, publish `frontend/dist`).
4. Click **Deploy**.

## GitHub Pages (optional)

Settings → Pages → Source → **GitHub Actions**, then run the **Deploy TextGist** workflow.

https://diyagupta0209.github.io/AI-text-summarizer/
