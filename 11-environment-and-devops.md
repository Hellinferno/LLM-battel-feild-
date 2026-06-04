# Environment And DevOps

## Runtime

Target stack:

- Next.js
- TypeScript
- Next.js API routes
- Postgres
- Node.js runtime for provider calls

## Required Environment Variables

```text
DATABASE_URL=postgres connection string
APP_ENCRYPTION_KEY=base64 encoded key for provider key encryption
AUTH_SECRET=secret used by the selected auth solution
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Provider keys are user-provided at runtime and should not be stored in deployment environment variables for MVP.

## Local Development

Recommended local setup:

1. Install dependencies.
2. Start Postgres locally or through Docker.
3. Set `.env.local`.
4. Run database migrations.
5. Start the Next.js development server.

Example commands:

```bash
npm install
npm run db:migrate
npm run dev
```

## Secret Handling

- `APP_ENCRYPTION_KEY` encrypts provider API keys before database storage.
- Raw API keys must not be logged.
- Raw API keys must not be returned from API routes.
- Error handling must pass messages through a secret redaction helper.
- Production secret values must be set through the deployment platform secret manager.

## Logging

Log:

- Benchmark run id.
- Provider name.
- Model name.
- Status.
- Latency.
- Safe error code.

Do not log:

- Raw API keys.
- Full authorization headers.
- Full provider request payloads containing user secrets.

## CI Checks

Recommended checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI should use mocked provider calls and must not require real provider API keys.

## Deployment

Recommended MVP deployment:

- Web app on a Next.js-compatible hosting platform.
- Managed Postgres database.
- Secret manager for environment variables.
- HTTPS enforced.

Deployment requirements:

- API routes must run in an environment that supports outbound provider API calls.
- Provider call timeout must be lower than the hosting platform route timeout.
- Database migrations must run before the app serves traffic.

## Monitoring

Track:

- Benchmark run count.
- Provider error rate.
- Timeout rate.
- Median and p95 latency by provider.
- API route failures.

Alerts:

- Sustained provider timeout spike.
- Database connection failures.
- Encryption or decryption failures.
- Production build or deployment failure.

