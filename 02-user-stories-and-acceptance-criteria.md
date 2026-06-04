# User Stories And Acceptance Criteria

## Users

- Developer evaluating models for an application feature.
- Prompt engineer comparing output quality across providers.
- Founder or product owner estimating latency and token behavior before choosing a provider.

## Story 1: Add Provider API Key

As a user, I want to add API keys for multiple LLM providers so that I can run comparisons from my own accounts.

Acceptance criteria:

- User can add keys for OpenAI, Anthropic, Google Gemini, Groq, Mistral, and OpenRouter.
- Raw API keys are submitted only to server routes.
- Stored keys are encrypted at rest.
- UI displays provider name, connection status, creation date, and last tested date.
- UI never displays the full key after saving.
- User can delete a saved key.

## Story 2: Test Provider Connection

As a user, I want to test whether a provider key works before running a benchmark.

Acceptance criteria:

- User can trigger a test for a saved provider key.
- A successful test shows the provider as connected.
- A failed test shows a safe error message without exposing the key.
- Provider test failures do not delete the saved key.

## Story 3: Select Multiple Models

As a user, I want to choose several provider/model pairs so that the same prompt can be tested across them.

Acceptance criteria:

- User can select one or more models from supported providers.
- Only providers with saved API keys are enabled for execution.
- UI clearly shows provider and model names.
- The run button is disabled until at least one model and a prompt are provided.

## Story 4: Run One Prompt Against Multiple LLMs

As a user, I want one prompt to be sent to all selected models so that results are directly comparable.

Acceptance criteria:

- The exact same prompt text is sent to each selected model.
- Shared generation settings are applied where the provider supports them.
- Provider calls execute in parallel.
- The result list preserves the selected provider/model order.
- A failed provider does not cancel other provider calls.

## Story 5: Compare Outputs And Metrics

As a user, I want to see every model output with token usage and generation time.

Acceptance criteria:

- Each provider/model result includes `provider`, `model`, `output`, `inputTokens`, `outputTokens`, `totalTokens`, `latencyMs`, `status`, and `errorMessage`.
- Token fields are shown as `Unknown` when the provider does not return usage.
- Latency is always shown in milliseconds.
- Error and timeout results remain visible in the comparison table.
- Output text can be expanded for long responses.

## Story 6: Review Benchmark History

As a user, I want to view previous benchmark runs so that I can compare experiments over time.

Acceptance criteria:

- User can view a list of previous runs.
- Each run shows date, prompt preview, selected providers, result status summary, and average latency.
- User can open a run and see its original prompt, settings, and per-provider results.
- History is scoped to the current user.

## Story 7: Rerun A Benchmark

As a user, I want to rerun an earlier benchmark with the same settings so that I can compare current provider behavior.

Acceptance criteria:

- User can rerun from a saved run detail page.
- New run stores a new timestamp and new result records.
- Original run remains unchanged.
- Rerun uses the latest saved API keys for each provider.

