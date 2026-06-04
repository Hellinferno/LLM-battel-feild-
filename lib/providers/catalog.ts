import type { ModelConfigSeed, Provider } from "./types";

export const PROVIDER_LABELS: Record<Provider, string> = {
  openai: "OpenAI ChatGPT",
  anthropic: "Anthropic Claude",
  google_gemini: "Google Gemini",
  xai_grok: "xAI Grok",
  deepseek: "DeepSeek",
  groq: "Groq",
  mistral: "Mistral",
  openrouter: "OpenRouter",
  custom_openai_compatible: "Custom OpenAI-compatible"
};

// Convenience helper so the catalog stays readable. The first model listed for
// each provider is used as the default when testing that provider's key.
function model(
  provider: Provider,
  model: string,
  displayName: string,
  overrides: Partial<Pick<ModelConfigSeed, "supportsTemperature" | "supportsMaxOutputTokens">> = {}
): ModelConfigSeed {
  return {
    provider,
    model,
    displayName,
    supportsTemperature: overrides.supportsTemperature ?? true,
    supportsMaxOutputTokens: overrides.supportsMaxOutputTokens ?? true,
    isActive: true
  };
}

export const DEFAULT_MODELS: ModelConfigSeed[] = [
  // OpenAI
  model("openai", "gpt-4.1-mini", "GPT-4.1 Mini"),
  model("openai", "gpt-4.1", "GPT-4.1"),
  model("openai", "gpt-4o", "GPT-4o"),
  model("openai", "gpt-4o-mini", "GPT-4o Mini"),
  model("openai", "o4-mini", "o4-mini (reasoning)", {
    supportsTemperature: false
  }),

  // Anthropic Claude
  model("anthropic", "claude-3-5-haiku-latest", "Claude 3.5 Haiku"),
  model("anthropic", "claude-3-5-sonnet-latest", "Claude 3.5 Sonnet"),
  model("anthropic", "claude-3-7-sonnet-latest", "Claude 3.7 Sonnet"),
  model("anthropic", "claude-sonnet-4-5", "Claude Sonnet 4.5"),
  model("anthropic", "claude-opus-4-1", "Claude Opus 4.1"),

  // Google Gemini
  model("google_gemini", "gemini-2.5-flash", "Gemini 2.5 Flash"),
  model("google_gemini", "gemini-2.5-pro", "Gemini 2.5 Pro"),
  model("google_gemini", "gemini-2.0-flash", "Gemini 2.0 Flash"),
  model("google_gemini", "gemini-1.5-flash", "Gemini 1.5 Flash"),
  model("google_gemini", "gemini-1.5-pro", "Gemini 1.5 Pro"),

  // xAI Grok
  model("xai_grok", "grok-3-mini", "Grok 3 Mini"),
  model("xai_grok", "grok-3", "Grok 3"),
  model("xai_grok", "grok-2-vision-1212", "Grok 2 Vision"),

  // DeepSeek
  model("deepseek", "deepseek-chat", "DeepSeek Chat (V3)"),
  model("deepseek", "deepseek-reasoner", "DeepSeek Reasoner (R1)", {
    supportsTemperature: false
  }),

  // Groq
  model("groq", "llama-3.3-70b-versatile", "Llama 3.3 70B Versatile"),
  model("groq", "llama-3.1-8b-instant", "Llama 3.1 8B Instant"),

  // Mistral
  model("mistral", "mistral-small-latest", "Mistral Small"),
  model("mistral", "mistral-large-latest", "Mistral Large"),
  model("mistral", "pixtral-large-latest", "Pixtral Large (vision)"),

  // OpenRouter
  model("openrouter", "openai/gpt-4.1-mini", "OpenRouter / GPT-4.1 Mini"),
  model("openrouter", "anthropic/claude-3.5-sonnet", "OpenRouter / Claude 3.5 Sonnet"),
  model("openrouter", "google/gemini-2.0-flash-001", "OpenRouter / Gemini 2.0 Flash"),

  // Custom OpenAI-compatible endpoint
  model("custom_openai_compatible", "custom-model", "Custom model")
];

export function getDefaultModel(provider: Provider): string {
  return DEFAULT_MODELS.find((model) => model.provider === provider)?.model ?? "custom-model";
}

