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

export const DEFAULT_MODELS: ModelConfigSeed[] = [
  {
    provider: "openai",
    model: "gpt-4.1-mini",
    displayName: "GPT-4.1 Mini",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "anthropic",
    model: "claude-3-5-sonnet-latest",
    displayName: "Claude 3.5 Sonnet",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "google_gemini",
    model: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "xai_grok",
    model: "grok-3-mini",
    displayName: "Grok 3 Mini",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "deepseek",
    model: "deepseek-chat",
    displayName: "DeepSeek Chat",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B Versatile",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "mistral",
    model: "mistral-small-latest",
    displayName: "Mistral Small",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "openrouter",
    model: "openai/gpt-4.1-mini",
    displayName: "OpenRouter GPT-4.1 Mini",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  },
  {
    provider: "custom_openai_compatible",
    model: "custom-model",
    displayName: "Custom model",
    supportsTemperature: true,
    supportsMaxOutputTokens: true,
    isActive: true
  }
];

export function getDefaultModel(provider: Provider): string {
  return DEFAULT_MODELS.find((model) => model.provider === provider)?.model ?? "custom-model";
}

