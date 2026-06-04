# Information Architecture

## Primary Navigation

- Dashboard
- New Benchmark
- History
- Provider Settings
- Account

## Dashboard

Purpose: give the user a fast path into the benchmark workflow and show recent activity.

Sections:

- Start benchmark action.
- Recent runs list.
- Metric summary: average latency, successful result count, timeout count, and provider coverage.
- Provider key status overview.

## New Benchmark

Purpose: configure and launch a comparison run.

Sections:

- Prompt editor.
- Optional system instruction.
- Provider/model selector.
- Shared generation settings.
- Run controls.
- Inline validation and disabled states.

Provider/model selector behavior:

- Group models by provider.
- Disable providers without a saved key.
- Allow multiple selected models across different providers.
- Show model labels using provider-native names.

## Results View

Purpose: compare all outputs and metrics from one run.

Sections:

- Run summary: prompt preview, created time, selected model count, overall status.
- Comparison table.
- Output panels.
- Error panel for failed or timeout results.
- Rerun and export actions.

Comparison columns:

- Provider
- Model
- Status
- Latency
- Input tokens
- Output tokens
- Total tokens
- Output preview
- Error

Missing token usage is displayed as `Unknown`.

## History

Purpose: retrieve previous benchmark runs.

Sections:

- Search by prompt text.
- Filters for provider, model, status, and date.
- Run list with summary metrics.
- Empty state for users with no runs.

History item fields:

- Run id.
- Created time.
- Prompt preview.
- Provider/model count.
- Success, error, and timeout counts.
- Average latency.

## Provider Settings

Purpose: manage user-owned provider credentials.

Sections:

- Provider key list.
- Add key form.
- Connection test actions.
- Delete key action.

Provider settings fields:

- Provider name.
- Masked key label.
- Connection status.
- Created time.
- Last tested time.

The UI must never display full API keys after creation.

## Account

Purpose: manage user-level preferences.

MVP account settings:

- Default timeout.
- Default generation settings.
- Data retention preference.

Team management and shared workspace settings are future additions.

