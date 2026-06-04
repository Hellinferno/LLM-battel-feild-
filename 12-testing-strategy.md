# Testing Strategy

## Goals

Verify that the system securely stores API keys, runs one prompt against multiple LLM providers, normalizes results consistently, measures latency, handles missing token data, preserves result order, and keeps history scoped to the current user.

## Unit Tests

## Benchmark Engine

Scenarios:

- Runs selected provider/model pairs in parallel.
- Returns one result per selected provider/model.
- Preserves selected order even when providers finish out of order.
- Marks a provider timeout as `status: "timeout"`.
- Stores token fields as `null` when usage is missing.
- Continues running other providers when one provider fails.

## Normalization

Scenarios:

- OpenAI usage maps to `inputTokens`, `outputTokens`, and `totalTokens`.
- Anthropic usage maps to normalized token fields.
- Google Gemini usage maps to normalized token fields when available.
- Groq usage maps through the OpenAI-compatible response shape.
- Mistral usage maps to normalized token fields.
- OpenRouter usage maps to normalized token fields when returned.
- Missing usage maps all token fields to `null`.
- Error responses set `output: null` and safe `errorMessage`.

## Secret Redaction

Scenarios:

- Raw API keys are removed from logs.
- Authorization headers are removed from diagnostic messages.
- Safe error messages do not include key substrings.

## Integration Tests

## Provider Key Routes

Scenarios:

- Create provider key encrypts before storage.
- List provider keys returns provider, key hint, and status, but never raw key.
- Delete provider key removes only the current user's key.
- Test provider key updates status and `lastTestedAt`.

## Benchmark Routes

Scenarios:

- Start benchmark validates prompt and selected models.
- Start benchmark rejects providers without saved keys.
- Fetch run status returns only the current user's run.
- Fetch results returns normalized `BenchmarkResult` objects.
- List history returns only current user's runs.

## Mocked Provider Tests

Use mocked provider responses by default so tests do not spend user credits.

Scenarios:

- Successful response with usage.
- Successful response without usage.
- Provider authentication error.
- Provider rate limit error.
- Network failure.
- Timeout.

## UI Tests

Scenarios:

- User can add a provider key.
- User can select multiple models.
- Run button is disabled without prompt or selected model.
- User can start a benchmark.
- Result table displays provider, model, output, tokens, latency, status, and error.
- Missing token usage displays as `Unknown`.
- Error and timeout rows remain visible.
- User can open a previous run from history.

## Security Tests

Scenarios:

- Browser never receives raw provider API keys after creation.
- Users cannot access another user's provider keys.
- Users cannot access another user's benchmark runs.
- Logs do not include raw keys in common error paths.

## Acceptance Verification

The MVP is acceptable when:

- The same prompt can be sent to OpenAI, Anthropic, Google Gemini, Groq, Mistral, and OpenRouter using user-provided keys.
- Results use the normalized shape:
  `provider`, `model`, `output`, `inputTokens`, `outputTokens`, `totalTokens`, `latencyMs`, `status`, `errorMessage`.
- Token fields can be `null`.
- Latency is measured server-side.
- Partial failures are visible and do not cancel the whole run.
- Historical runs can be reviewed by the owner.

