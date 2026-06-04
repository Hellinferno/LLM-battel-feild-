# System Architecture

## Overview

The system is a Next.js TypeScript application with server-side API routes. The browser renders benchmark configuration and result comparison screens. API routes perform authentication, credential lookup, benchmark orchestration, result persistence, and response normalization.

Provider API keys never leave the server. Keys are encrypted before storage and decrypted only inside server-side provider execution code.

## Major Components

## Next.js UI

Responsibilities:

- Render dashboard, benchmark form, result comparison, history, and provider settings.
- Submit prompts and selected provider/model pairs to API routes.
- Display normalized benchmark results.
- Show safe provider connection errors.

The UI must not import provider SDKs or access raw API keys.

## API Routes

Responsibilities:

- Validate request payloads.
- Authenticate the current user.
- Authorize access to provider keys and benchmark runs.
- Create benchmark run records.
- Call the benchmark engine.
- Return normalized result payloads.

Primary API route groups:

- `/api/provider-keys`
- `/api/provider-keys/{id}/test`
- `/api/models`
- `/api/benchmark-runs`
- `/api/benchmark-runs/{id}`
- `/api/benchmark-runs/{id}/results`

## Benchmark Engine

Responsibilities:

- Accept one prompt and a list of provider/model selections.
- Load and decrypt required API keys.
- Dispatch provider calls in parallel.
- Measure server-side latency for each provider call.
- Enforce provider timeout rules.
- Normalize success, error, and timeout results.
- Persist per-provider results.

The engine returns one `BenchmarkResult` per selected provider/model.

## Provider Adapters

Each provider has one adapter:

- OpenAI adapter.
- Anthropic adapter.
- Google Gemini adapter.
- Groq adapter.
- Mistral adapter.
- OpenRouter adapter.

Adapter responsibilities:

- Build provider-specific request payloads.
- Call provider APIs with the user's API key.
- Extract output text.
- Extract token usage when returned.
- Convert provider errors to safe application errors.
- Return a normalized `BenchmarkResult`.

## Database

Responsibilities:

- Store users.
- Store encrypted provider keys.
- Store available model configurations.
- Store benchmark runs.
- Store per-provider benchmark results.
- Store error details safe for user display and internal diagnostics.

Postgres is the recommended relational database for MVP because benchmark runs and results have clear relational structure.

## Normalized Result Shape

```ts
type BenchmarkResult = {
  provider: string;
  model: string;
  output: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
  status: "success" | "error" | "timeout";
  errorMessage: string | null;
};
```

Rules:

- `latencyMs` is measured server-side for every result.
- Token values may be `null` when not returned by the provider.
- `output` is `null` for error and timeout results.
- `errorMessage` is `null` for successful results.
- Result order matches the user's selected provider/model order.

## Security Requirements

- Raw provider keys are accepted only by server routes.
- Keys are encrypted at rest.
- Decryption is limited to provider execution and connection testing.
- Logs must never include raw API keys or full provider request headers.
- Error messages returned to the UI must be safe and should not include provider secrets.

