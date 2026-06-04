# Database Schema

## Database Choice

Use Postgres for MVP. The schema supports multiple users, multiple providers, multiple models per benchmark run, and historical comparison.

## Tables

## users

Stores application users.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| email | text | Unique, required |
| name | text | Optional display name |
| created_at | timestamptz | Required |
| updated_at | timestamptz | Required |

## provider_keys

Stores encrypted API keys for each user and provider.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users.id |
| provider | text | `openai`, `anthropic`, `google_gemini`, `groq`, `mistral`, `openrouter` |
| encrypted_key | text | Encrypted API key |
| key_hint | text | Last 4 characters or provider-safe label |
| status | text | `untested`, `connected`, `failed` |
| last_tested_at | timestamptz | Nullable |
| created_at | timestamptz | Required |
| updated_at | timestamptz | Required |

Constraints:

- Unique `(user_id, provider)` for MVP.
- Do not store raw API keys.

## model_configs

Stores supported provider models.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| provider | text | Supported provider key |
| model | text | Provider-native model name |
| display_name | text | Human-readable label |
| supports_temperature | boolean | Required |
| supports_max_output_tokens | boolean | Required |
| is_active | boolean | Required |
| created_at | timestamptz | Required |
| updated_at | timestamptz | Required |

## benchmark_runs

Stores one user-submitted benchmark request.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users.id |
| prompt | text | Required |
| system_instruction | text | Nullable |
| settings | jsonb | Shared generation settings |
| status | text | `pending`, `running`, `completed`, `completed_with_errors`, `failed` |
| selected_models | jsonb | Ordered provider/model selections |
| created_at | timestamptz | Required |
| completed_at | timestamptz | Nullable |

## benchmark_results

Stores one result for each selected provider/model in a run.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| benchmark_run_id | uuid | Foreign key to benchmark_runs.id |
| provider | text | Provider name |
| model | text | Provider-native model name |
| output | text | Nullable |
| input_tokens | integer | Nullable |
| output_tokens | integer | Nullable |
| total_tokens | integer | Nullable |
| latency_ms | integer | Required |
| status | text | `success`, `error`, `timeout` |
| error_message | text | Nullable, safe for UI |
| result_order | integer | Preserves selected order |
| raw_usage | jsonb | Nullable provider usage metadata |
| created_at | timestamptz | Required |

Constraints:

- Unique `(benchmark_run_id, result_order)`.
- `output` is nullable because error and timeout results have no generated text.
- Token fields are nullable because not all providers return token usage.

## provider_errors

Stores internal diagnostic details for failed provider calls.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| benchmark_result_id | uuid | Foreign key to benchmark_results.id |
| provider | text | Provider name |
| error_code | text | Nullable |
| safe_message | text | Message returned to UI |
| diagnostic_message | text | Internal message without secrets |
| created_at | timestamptz | Required |

## Indexes

- `provider_keys_user_provider_idx` on `(user_id, provider)`.
- `benchmark_runs_user_created_idx` on `(user_id, created_at desc)`.
- `benchmark_results_run_order_idx` on `(benchmark_run_id, result_order)`.
- `benchmark_results_provider_model_idx` on `(provider, model)`.

## Retention

MVP keeps benchmark history until the user deletes it. Future retention policies can delete old runs and results by user preference or workspace policy.

