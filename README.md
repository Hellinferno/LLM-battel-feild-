# LLM Battle

Local-first LLM API key benchmark app. Enter one prompt, select multiple provider/model pairs, run them in parallel, and compare output, token usage, latency, and errors.

## Run Locally

```bash
npm install
npm run db:init
npm run dev
```

Open `http://localhost:3000`.

## Providers

Built-in providers include OpenAI/ChatGPT, Anthropic Claude, Google Gemini, xAI Grok, DeepSeek, Groq, Mistral, OpenRouter, and custom OpenAI-compatible endpoints.

## Deploy On Vercel

Use these Vercel project settings:

- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

The repository also includes `vercel.json` with these settings so Vercel does not look for a static `public` output folder.

Required environment variables:

```text
DATABASE_URL=file:/tmp/llm-battle/dev.db
APP_ENCRYPTION_KEY=<32-byte-base64-key>
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

This MVP is still local-first. If the Vercel database is missing or uninitialized, `GET /api/models` falls back to the built-in model catalog so the homepage can load in degraded demo mode. In that mode, models are shown as disabled because saved provider keys cannot be read.

Saving provider keys, running benchmarks, and viewing benchmark history still require an initialized database. The SQLite database on Vercel is suitable only for a demo because serverless storage is not durable. For a real public app, switch Prisma to a hosted Postgres database before collecting user API keys.
