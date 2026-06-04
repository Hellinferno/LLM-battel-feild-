import type { BenchmarkResult, BenchmarkSettings, ModelSelection, Provider } from "@/lib/providers/types";

export type ProviderKeyView = {
  id: string;
  provider: Provider;
  label: string | null;
  baseUrl: string | null;
  keyHint: string;
  status: "untested" | "connected" | "failed";
  createdAt: string;
  lastTestedAt: string | null;
};

export type ModelView = {
  provider: Provider;
  providerLabel: string;
  model: string;
  displayName: string;
  supportsTemperature: boolean;
  supportsMaxOutputTokens: boolean;
  enabled: boolean;
};

export type ProviderModelGroup = {
  provider: Provider;
  providerLabel: string;
  label: string | null;
  models: Array<{ provider: Provider; model: string; displayName: string }>;
  error: string | null;
};

export type ProviderModelsResponse = {
  providers: ProviderModelGroup[];
};

export type BenchmarkRunView = {
  id: string;
  prompt: string;
  systemInstruction: string | null;
  settings: BenchmarkSettings;
  status: string;
  selectedModels: ModelSelection[];
  createdAt: string;
  completedAt: string | null;
};

export type HistoryItem = {
  id: string;
  promptPreview: string;
  status: string;
  providerCount: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  averageLatencyMs: number;
  createdAt: string;
};

export type BenchmarkResultsPayload = {
  runId: string;
  results: BenchmarkResult[];
};

