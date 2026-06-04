# Project Design

## Product Vision

Build a web application that lets a user compare multiple API-key-based LLMs from a single prompt. The user enters one input, selects providers and models, runs the benchmark, and reviews output quality, token usage, latency, and errors side by side.

The product is intended for developers, founders, prompt engineers, and AI product teams who need practical evidence before choosing a model for a workflow.

## Core Workflow

1. User signs in or starts a local session.
2. User adds API keys for supported providers.
3. User selects one or more provider/model pairs.
4. User enters a shared prompt and optional generation settings.
5. System sends the same request to each selected model in parallel.
6. System captures normalized outputs and metrics.
7. User compares responses, token counts, latency, and errors in one result view.
8. User can save, rerun, or export a benchmark run.

## Supported Providers

The MVP supports explicit adapters for:

- OpenAI
- Anthropic
- Google Gemini
- Groq
- Mistral
- OpenRouter

Each adapter must normalize provider responses into the shared result shape:

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

Token fields may be `null` when the provider does not return usage data. Latency is always measured server-side.

## User Roles

- Individual user: Adds personal API keys, runs comparisons, views history.
- Team user: Shares benchmark runs and compares provider choices across projects.
- Admin: Manages workspace settings, retention, and provider availability.

Team and admin capabilities are future-facing unless explicitly included in a later build phase.

## Main Screens

## Dashboard

- Recent benchmark runs.
- Quick action to start a new comparison.
- Summary cards for average latency, token cost estimate, and most-used providers.

## Provider Settings

- Add, edit, test, and delete provider API keys.
- Show provider connection status without displaying full secrets.
- Allow one active key per provider per user for MVP.

## New Benchmark

- Prompt editor.
- Provider/model selector.
- Shared generation settings: temperature, max output tokens, and system instruction.
- Run button with loading state.

## Results

- Side-by-side output comparison.
- Table columns: provider, model, status, latency, input tokens, output tokens, total tokens, and error.
- Expandable output panels for long responses.
- Rerun benchmark with same settings.

## History

- List previous benchmark runs.
- Filter by provider, model, date, status, and saved label.
- Open a past run in the result view.

## Comparison Table Behavior

- Results appear in the same provider/model order selected by the user.
- Successful responses show output and metrics.
- Failed responses remain visible with status and error message.
- Timeout responses show measured timeout duration and no output.
- Missing token usage is shown as `Unknown`, not `0`.
- Latency is measured from the server just before the provider request starts until the provider call resolves or fails.

## Non-Goals For MVP

- Training or fine-tuning models.
- Automatic model ranking based on subjective quality.
- BYO arbitrary REST adapter.
- Full cost accounting across every provider billing plan.
- Streaming token-by-token comparison.
- Multi-user collaboration and shared workspaces.

