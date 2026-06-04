# Engineering Scope Definition

## MVP Goal

Build a Next.js TypeScript application that lets one authenticated user add provider API keys, run one prompt against multiple selected LLM models, and compare normalized output, token usage, latency, and errors.

## In Scope

- Provider key management for OpenAI, Anthropic, Google Gemini, Groq, Mistral, and OpenRouter.
- Encrypted provider key storage.
- Provider connection testing.
- Model selection across supported providers.
- Prompt submission with optional system instruction.
- Shared generation settings: temperature, max output tokens, and timeout.
- Parallel benchmark execution.
- Normalized result shape:
  - `provider`
  - `model`
  - `output`
  - `inputTokens`
  - `outputTokens`
  - `totalTokens`
  - `latencyMs`
  - `status`
  - `errorMessage`
- Benchmark history per user.
- Result comparison table.
- Error and timeout visibility.

## Out Of Scope For MVP

- Arbitrary custom REST provider builder.
- Automatic subjective quality scoring.
- Streaming comparison.
- Provider cost calculation with live pricing.
- Prompt version control.
- Team sharing.
- Admin analytics.
- Fine-tuning.
- Model training.
- Native mobile apps.

## Constraints

- Browser code must never receive raw provider API keys.
- Token fields must support `null` because providers differ in usage reporting.
- Latency must be measured server-side for consistent comparison.
- One provider failure must not fail the entire benchmark run.
- Result order must match selection order, not response completion order.
- Real provider calls may spend user credits, so retries are disabled in MVP.

## Security Requirements

- Encrypt API keys at rest.
- Redact secrets from logs.
- Redact secrets from error messages.
- Authenticate all provider-key and benchmark-history routes.
- Authorize benchmark run access by owner.
- Avoid storing full raw provider responses unless a future privacy review approves it.

## Future Expansion

- Team workspaces and shared runs.
- Cost estimation based on provider pricing.
- Streaming outputs.
- Quality rating and human review rubrics.
- Export to CSV, JSON, and Markdown.
- Custom provider adapters.
- Scheduled benchmark runs.
- Regression alerts for prompt behavior changes.

