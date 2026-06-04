# Development Phases

## Phase 1: Foundation

Goal: create the Next.js TypeScript application foundation.

Deliverables:

- Next.js app with TypeScript.
- App shell with dashboard, benchmark, history, and provider settings routes.
- Environment configuration.
- Database connection.
- Initial schema migrations.
- Authentication placeholder or selected auth integration.

Acceptance criteria:

- App starts locally.
- Navigation loads all primary pages.
- Database migration creates required tables.

## Phase 2: Provider Key Management

Goal: let users save and test provider API keys securely.

Deliverables:

- Provider key create, list, delete, and test API routes.
- Encryption helper.
- Secret redaction helper.
- Provider settings UI.
- Mocked provider key tests.

Acceptance criteria:

- Keys are encrypted before storage.
- Full keys are never returned to the browser.
- User can test each supported provider key.

## Phase 3: Provider Adapters

Goal: implement provider-specific adapters behind one interface.

Deliverables:

- OpenAI adapter.
- Anthropic adapter.
- Google Gemini adapter.
- Groq adapter.
- Mistral adapter.
- OpenRouter adapter.
- Shared provider adapter types.
- Normalization tests using mocked responses.

Acceptance criteria:

- Each adapter returns `BenchmarkResult`.
- Missing token usage maps to `null`.
- Provider errors map to safe application errors.

## Phase 4: Benchmark Engine

Goal: run one prompt against multiple selected models.

Deliverables:

- Parallel execution engine.
- Timeout handling.
- Server-side latency measurement.
- Result ordering.
- Persistence for runs and results.
- Engine unit tests.

Acceptance criteria:

- One failing provider does not cancel other providers.
- Results are stored in selection order.
- Timeout and error results are visible and persisted.

## Phase 5: Benchmark UI

Goal: provide the main user workflow.

Deliverables:

- Prompt editor.
- Provider/model selector.
- Shared generation settings controls.
- Run submission flow.
- Loading and partial result states.
- Result comparison table.
- Expandable output panels.

Acceptance criteria:

- User can run a benchmark from the UI.
- User can compare output, token usage, latency, and errors.
- Missing token usage displays as `Unknown`.

## Phase 6: History And Rerun

Goal: preserve and reuse benchmark results.

Deliverables:

- History API.
- History list UI.
- Run detail view.
- Rerun action using previous prompt and settings.

Acceptance criteria:

- User can open previous runs.
- User can rerun a previous benchmark.
- Original run remains unchanged.

## Phase 7: Testing And Deployment

Goal: make the MVP reliable enough to deploy.

Deliverables:

- Unit tests.
- Integration tests.
- UI workflow tests.
- CI checks.
- Production environment documentation.
- Deployment configuration.

Acceptance criteria:

- Test suite passes in CI.
- Required environment variables are documented.
- Production build succeeds.

