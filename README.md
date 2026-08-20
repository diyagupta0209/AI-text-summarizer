# TextGist

React UI on Vercel. Express API on Render. If the API is missing or asleep, Generate still works in the browser.

## 1. Deploy the backend on Render

1. Open [https://dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. **New + → Web Service → Build and deploy from a Git repository**.
3. Connect **diyagupta0209/AI-text-summarizer**.
4. Use these settings (also in `render.yaml`):

   | Field | Value |
   | --- | --- |
   | Name | `textgist-api` |
   | Region | any |
   | Branch | `main` |
   | Runtime | Node |
   | Build command | `npm ci --prefix backend` |
   | Start command | `npm start --prefix backend` |
   | Instance | Free |

5. Environment variables:

   | Key | Value |
   | --- | --- |
   | `SUMMARIZER_PROVIDER` | `local` |
   | `NODE_ENV` | `production` |

   Do not add `OPENAI_API_KEY` unless you are paying for OpenAI.

6. Click **Deploy**. Wait until it is Live.
7. Copy the service URL, for example `https://textgist-api.onrender.com` (no trailing slash).
8. Open `https://YOUR-SERVICE.onrender.com/api/health` in the browser. You should see JSON with `"status":"ok"`.

Free Render services sleep after idle time. The first Generate after a sleep can take 30–60 seconds.

## 2. Deploy the frontend on Vercel

1. Open [https://vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **diyagupta0209/AI-text-summarizer**.
3. Leave the root directory as the **repository root**. `vercel.json` builds `frontend/`.
4. Before the first production deploy, add an environment variable:

   | Key | Value | Environment |
   | --- | --- | --- |
   | `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com` | Production (and Preview if you want) |

   Use the Render URL from step 7. No trailing slash.

5. Click **Deploy**.
6. Open the Vercel URL (for example `https://ai-text-summarizer.vercel.app`).

If you add `VITE_API_URL` **after** the first deploy, click **Redeploy** so Vite can bake the URL into the build.

## 3. How a request works

```text
Browser (Vercel)
  → POST https://your-api.onrender.com/api/summarize
  → if that fails, summarize in the browser
```

## Local development

```powershell
cd frontend
npm install
npm run dev
```

Optional API:

```powershell
cd backend
npm install
npm start
```

To point local Vite at a local API, create `frontend/.env.local`:

```
VITE_API_URL=http://127.0.0.1:5000
```
