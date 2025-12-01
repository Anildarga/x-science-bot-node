# x-science-bot-node

Node.js version of the X (Twitter) Science Bot, ready to deploy on Vercel.

## Features
- Posts daily science tweets (image or text)
- Image sources: NASA APOD, Unsplash, OpenAI (optional)
- Uses `twitter-api-v2` (v1.1 media upload) for posting images
- Vercel cron ready

## Files
- `api/science_bot.js` — Vercel serverless function
- `package.json` — Node dependencies and scripts
- `vercel.json` — Vercel config (cron + functions)
- `requirements.txt` — *not used* (kept empty for parity)
- `README.md`, `.gitignore`, `LICENSE`

## Environment variables (set in Vercel)
- `TW_API_KEY` (consumer key)
- `TW_API_SECRET` (consumer secret)
- `TW_ACCESS_TOKEN` (access token)
- `TW_ACCESS_SECRET` (access token secret)
- `UNSPLASH_KEY` (optional)
- `OPENAI_API_KEY` (optional)
- `NASA_API_KEY` (optional, defaults to DEMO_KEY)

## Deploy
1. Push this repo to GitHub.
2. Import to Vercel (Import Project → select repository).
   - Root Directory: `/`
   - Framework Preset: Other
3. Add environment variables in Vercel (see above).
4. Deploy and test:
   `https://<your-vercel-domain>/api/science_bot`

## Local test
- Install node (>=18) and run:
  ```
  npm install
  node api/science_bot.js
  ```
  Or call `runBot()` after adding a small wrapper (for quick dev).

