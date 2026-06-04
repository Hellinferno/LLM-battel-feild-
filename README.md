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
