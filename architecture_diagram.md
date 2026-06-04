# Architecture Diagram

## Request Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as Next.js UI
  participant API as API Route
  participant Engine as Benchmark Engine
  participant Adapters as Provider Adapters
  participant DB as Database
  participant LLMs as LLM Providers

  User->>UI: Enter prompt and select models
  UI->>API: POST /api/benchmark-runs
  API->>DB: Create benchmark_run
  API->>Engine: Execute selected provider/model pairs
  Engine->>Adapters: Run requests in parallel
  Adapters->>LLMs: Provider API calls
  LLMs-->>Adapters: Provider-specific responses
  Adapters-->>Engine: Normalized BenchmarkResult objects
  Engine->>DB: Store benchmark_results
  API-->>UI: Run id and result summary
  UI->>API: GET /api/benchmark-runs/{id}
  API->>DB: Load run with results
  API-->>UI: Normalized comparison payload
```

## Provider Adapter Flow

```mermaid
flowchart TD
  A[Benchmark Engine] --> B[Select Adapter]
  B --> C{Provider}
  C --> D[OpenAI Adapter]
  C --> E[Anthropic Adapter]
  C --> F[Google Gemini Adapter]
  C --> G[Groq Adapter]
  C --> H[Mistral Adapter]
  C --> I[OpenRouter Adapter]
  D --> J[Measure latency]
  E --> J
  F --> J
  G --> J
  H --> J
  I --> J
  J --> K[Map output text]
  K --> L[Map usage tokens]
  L --> M[Normalize errors]
  M --> N[BenchmarkResult]
```

## Result Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Running: benchmark starts
  Running --> Success: provider response received
  Running --> Timeout: provider exceeds timeout
  Running --> Error: provider request fails
  Success --> Persisted: result saved
  Timeout --> Persisted: timeout saved
  Error --> Persisted: error saved
  Persisted --> Displayed: UI fetches run
  Displayed --> Rerun: user reruns same settings
  Rerun --> Running
```

## Deployment Shape

```mermaid
flowchart LR
  Browser[Browser] --> Web[Next.js App]
  Web --> Routes[Next.js API Routes]
  Routes --> Engine[Benchmark Engine]
  Routes --> SecretBox[Encryption Service]
  Routes --> DB[(Postgres)]
  Engine --> Providers[External LLM APIs]
  SecretBox --> DB
```

The application keeps provider API keys on the server. Browser code never receives raw API keys.

