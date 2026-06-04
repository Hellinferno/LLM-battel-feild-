# API Contracts

## Common Types

```ts
type Provider =
  | "openai"
  | "anthropic"
  | "google_gemini"
  | "groq"
  | "mistral"
  | "openrouter";

type BenchmarkResult = {
  provider: Provider;
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

## Error Response

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
  };
};
```

Error messages must be safe for display and must not include raw API keys.

## Create Provider Key

`POST /api/provider-keys`

Request:

```json
{
  "provider": "openai",
  "apiKey": "sk-user-provided-key"
}
```

Response `201`:

```json
{
  "id": "provider-key-id",
  "provider": "openai",
  "keyHint": "1234",
  "status": "untested",
  "createdAt": "2026-06-04T00:00:00.000Z",
  "lastTestedAt": null
}
```

## List Provider Keys

`GET /api/provider-keys`

Response `200`:

```json
{
  "providerKeys": [
    {
      "id": "provider-key-id",
      "provider": "openai",
      "keyHint": "1234",
      "status": "connected",
      "createdAt": "2026-06-04T00:00:00.000Z",
      "lastTestedAt": "2026-06-04T00:10:00.000Z"
    }
  ]
}
```

## Delete Provider Key

`DELETE /api/provider-keys/{id}`

Response `204`: empty body.

## Test Provider Key

`POST /api/provider-keys/{id}/test`

Response `200`:

```json
{
  "provider": "openai",
  "status": "connected",
  "message": "Provider key is valid.",
  "lastTestedAt": "2026-06-04T00:10:00.000Z"
}
```

Failed test response `200`:

```json
{
  "provider": "openai",
  "status": "failed",
  "message": "Provider rejected the key.",
  "lastTestedAt": "2026-06-04T00:10:00.000Z"
}
```

## List Models

`GET /api/models`

Response `200`:

```json
{
  "models": [
    {
      "provider": "openai",
      "model": "gpt-4.1-mini",
      "displayName": "GPT-4.1 Mini",
      "enabled": true
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-latest",
      "displayName": "Claude 3.5 Sonnet",
      "enabled": true
    }
  ]
}
```

`enabled` is false when the user has no saved key for that provider.

## Start Benchmark Run

`POST /api/benchmark-runs`

Request:

```json
{
  "prompt": "Explain database indexes to a beginner.",
  "systemInstruction": "Answer clearly and concisely.",
  "settings": {
    "temperature": 0.4,
    "maxOutputTokens": 800,
    "timeoutMs": 60000
  },
  "models": [
    { "provider": "openai", "model": "gpt-4.1-mini" },
    { "provider": "anthropic", "model": "claude-3-5-sonnet-latest" }
  ]
}
```

Response `202`:

```json
{
  "runId": "benchmark-run-id",
  "status": "running",
  "createdAt": "2026-06-04T00:00:00.000Z"
}
```

## Fetch Run Status

`GET /api/benchmark-runs/{id}`

Response `200`:

```json
{
  "id": "benchmark-run-id",
  "prompt": "Explain database indexes to a beginner.",
  "systemInstruction": "Answer clearly and concisely.",
  "settings": {
    "temperature": 0.4,
    "maxOutputTokens": 800,
    "timeoutMs": 60000
  },
  "status": "completed_with_errors",
  "selectedModels": [
    { "provider": "openai", "model": "gpt-4.1-mini" },
    { "provider": "anthropic", "model": "claude-3-5-sonnet-latest" }
  ],
  "createdAt": "2026-06-04T00:00:00.000Z",
  "completedAt": "2026-06-04T00:01:00.000Z"
}
```

## Fetch Run Results

`GET /api/benchmark-runs/{id}/results`

Response `200`:

```json
{
  "runId": "benchmark-run-id",
  "results": [
    {
      "provider": "openai",
      "model": "gpt-4.1-mini",
      "output": "A database index is like a lookup table...",
      "inputTokens": 18,
      "outputTokens": 114,
      "totalTokens": 132,
      "latencyMs": 1840,
      "status": "success",
      "errorMessage": null
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-latest",
      "output": null,
      "inputTokens": null,
      "outputTokens": null,
      "totalTokens": null,
      "latencyMs": 60000,
      "status": "timeout",
      "errorMessage": "Provider request timed out."
    }
  ]
}
```

## List Benchmark History

`GET /api/benchmark-runs?limit=20&provider=openai&status=completed`

Response `200`:

```json
{
  "runs": [
    {
      "id": "benchmark-run-id",
      "promptPreview": "Explain database indexes to a beginner.",
      "status": "completed_with_errors",
      "providerCount": 2,
      "successCount": 1,
      "errorCount": 0,
      "timeoutCount": 1,
      "averageLatencyMs": 30920,
      "createdAt": "2026-06-04T00:00:00.000Z"
    }
  ]
}
```

