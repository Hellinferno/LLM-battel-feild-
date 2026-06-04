# Computation Engine Spec

## Purpose

The benchmark engine accepts one prompt and an ordered list of provider/model selections. It executes each selected model using the user's saved API key, measures latency, captures token usage when available, and returns normalized results for comparison.

## Inputs

```ts
type BenchmarkRunInput = {
  userId: string;
  prompt: string;
  systemInstruction: string | null;
  settings: {
    temperature?: number;
    maxOutputTokens?: number;
    timeoutMs: number;
  };
  models: Array<{
    provider: Provider;
    model: string;
  }>;
};
```

Supported providers:

- OpenAI
- Anthropic
- Google Gemini
- Groq
- Mistral
- OpenRouter

## Output

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

The engine returns one result for each selected provider/model pair.

## Execution Rules

- Execute provider calls in parallel.
- Preserve the user's selected provider/model order in persisted and returned results.
- Use the same prompt for every provider call.
- Apply shared settings where supported by the provider.
- Do not cancel remaining providers when one provider fails.
- Measure latency server-side around the provider call.
- Store every result, including errors and timeouts.

## Timeout Rules

- Each provider call receives the same `timeoutMs` value unless a later provider-specific override is introduced.
- A timeout returns status `timeout`.
- Timeout results have `output: null`.
- Timeout results have token fields set to `null`.
- Timeout results include a safe `errorMessage`, such as `Provider request timed out.`

## Token Rules

- Extract token usage from provider response metadata when available.
- Map usage to `inputTokens`, `outputTokens`, and `totalTokens`.
- If a provider returns only total usage, store `totalTokens` and set unknown parts to `null`.
- If a provider returns no usage, all token fields are `null`.
- Never infer token counts in MVP unless a future explicit tokenizer feature is added.

## Error Rules

- Provider authentication failures return status `error`.
- Provider rate limits return status `error`.
- Provider invalid model failures return status `error`.
- Network failures return status `error` unless caused by timeout handling.
- Error results have `output: null`.
- Error messages shown to users must be safe and must not include API keys, raw headers, or full provider payloads.

## Normalization Rules

Every adapter returns the normalized `BenchmarkResult` shape. Provider-specific response fields are not exposed directly to the UI.

Normalization includes:

- Extracting the main text output.
- Mapping usage metadata.
- Converting provider-specific errors.
- Setting `latencyMs`.
- Setting `status`.
- Setting `errorMessage`.

## Result Ordering

The engine assigns `result_order` based on the original selection index. The UI sorts by `result_order`, not by completion time.

## Persistence Rules

- Create a benchmark run before provider execution starts.
- Store selected model order on the run.
- Store each result as soon as it resolves.
- Mark the run `completed` when all results succeed.
- Mark the run `completed_with_errors` when at least one result is `error` or `timeout` and at least one result completed.
- Mark the run `failed` only when no provider result can be produced.

## Retry Rules

MVP does not automatically retry provider generation calls. This avoids accidental duplicate token spending. Future versions may add opt-in retry for transient network failures.

