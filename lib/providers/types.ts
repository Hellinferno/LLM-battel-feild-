export const PROVIDERS = [
  "openai",
  "anthropic",
  "google_gemini",
  "xai_grok",
  "deepseek",
  "groq",
  "mistral",
  "openrouter",
  "custom_openai_compatible"
] as const;

export type Provider = (typeof PROVIDERS)[number];

export type ProviderStatus = "untested" | "connected" | "failed";
export type ResultStatus = "success" | "error" | "timeout";
export type RunStatus = "pending" | "running" | "completed" | "completed_with_errors" | "failed";

export type BenchmarkSettings = {
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs: number;
};

export type ModelSelection = {
  provider: Provider;
  model: string;
  label?: string | null;
  baseUrl?: string | null;
};

export type ImageInput = {
  /** MIME type, e.g. "image/png". */
  mimeType: string;
  /** Base64-encoded image bytes, without the `data:` URL prefix. */
  data: string;
};

export type BenchmarkResult = {
  provider: Provider;
  model: string;
  output: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
  status: ResultStatus;
  errorMessage: string | null;
  rawUsage?: unknown;
};

export type ProviderRunInput = {
  apiKey: string;
  prompt: string;
  systemInstruction: string | null;
  settings: BenchmarkSettings;
  model: string;
  provider: Provider;
  baseUrl?: string | null;
  images?: ImageInput[];
};

export type ProviderKeyTestResult = {
  status: "connected" | "failed";
  message: string;
};

export type ProviderAdapter = {
  provider: Provider;
  run(input: ProviderRunInput): Promise<BenchmarkResult>;
  testKey(input: Pick<ProviderRunInput, "apiKey" | "model" | "baseUrl">): Promise<ProviderKeyTestResult>;
};

export type ModelConfigSeed = {
  provider: Provider;
  model: string;
  displayName: string;
  supportsTemperature: boolean;
  supportsMaxOutputTokens: boolean;
  isActive: boolean;
};

