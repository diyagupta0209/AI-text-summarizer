# TextGist

Full-stack text summarization app: React UI plus an Express API. Summaries run in the browser for free. OpenAI is optional.

## Local setup

```powershell
git checkout main
git pull origin main
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Deploy (GitHub Pages)

The live site is meant to be:

**https://diyagupta0209.github.io/AI-text-summarizer/**

Enable it once in the GitHub repo:

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Push to `main` (or open the **Actions** tab and run **Deploy TextGist**)

After the workflow is green, wait a minute and open the Pages URL. Hard-refresh if you still see an old page.

## Optional: one Node host (Render)

`render.yaml` builds the React app and serves it from Express. Create a Web Service from this GitHub repo on [Render](https://render.com) if you want a single backend URL instead of Pages.

## Optional OpenAI

Paid. Keep `SUMMARIZER_PROVIDER=local` unless you add billing and set `SUMMARIZER_PROVIDER=openai` with `OPENAI_API_KEY`.

