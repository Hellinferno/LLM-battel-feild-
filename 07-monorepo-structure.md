# Monorepo Structure

## Recommended Structure

Use a single Next.js TypeScript application for MVP. Keep the code organized so provider adapters, benchmark execution, database access, and UI components remain independently testable.

```text
llm-benchmark/
  app/
    page.tsx
    benchmark/
      page.tsx
    history/
      page.tsx
    provider-settings/
      page.tsx
    api/
      provider-keys/
        route.ts
        [id]/
          route.ts
          test/
            route.ts
      models/
        route.ts
      benchmark-runs/
        route.ts
        [id]/
          route.ts
          results/
            route.ts
  components/
    benchmark/
      prompt-editor.tsx
      model-selector.tsx
      result-table.tsx
      output-panel.tsx
    providers/
      provider-key-form.tsx
      provider-key-list.tsx
    layout/
      app-shell.tsx
      navigation.tsx
  lib/
    auth/
      current-user.ts
    benchmark/
      engine.ts
      types.ts
      normalization.ts
      timing.ts
    providers/
      types.ts
      registry.ts
      openai.ts
      anthropic.ts
      google-gemini.ts
      groq.ts
      mistral.ts
      openrouter.ts
    security/
      encryption.ts
      secret-redaction.ts
    db/
      client.ts
      provider-keys.ts
      benchmark-runs.ts
      benchmark-results.ts
  db/
    migrations/
      001_initial_schema.sql
    seed-models.ts
  tests/
    unit/
      benchmark-engine.test.ts
      normalization.test.ts
      secret-redaction.test.ts
    integration/
      provider-key-routes.test.ts
      benchmark-run-routes.test.ts
    fixtures/
      provider-responses.ts
  docs/
    project_design.md
```

## Responsibility Boundaries

## `app`

Contains routes, pages, and server API route handlers. API handlers should validate inputs, authorize access, call library functions, and return typed responses.

## `components`

Contains reusable UI components. Components should receive data as props and should not call provider APIs directly.

## `lib/benchmark`

Contains benchmark orchestration. This is where parallel execution, timeout handling, result ordering, and normalized result creation live.

## `lib/providers`

Contains one adapter per supported provider:

- OpenAI
- Anthropic
- Google Gemini
- Groq
- Mistral
- OpenRouter

All adapters implement the same interface:

```ts
type ProviderAdapter = {
  provider: Provider;
  run(input: ProviderRunInput): Promise<BenchmarkResult>;
  testKey(apiKey: string): Promise<ProviderKeyTestResult>;
};
```

## `lib/security`

Contains encryption and secret redaction helpers. No other module should implement ad hoc secret masking.

## `lib/db`

Contains database access functions. API routes and benchmark engine code should not embed SQL directly outside this layer.

## `tests`

Contains unit and integration tests. Provider calls should be mocked by default so tests do not require real API keys.

## Documentation Location

For the current greenfield spec task, requested Markdown files live at the workspace root. When the app scaffold is created, these documents may be moved under `docs/` with links from the root README.

