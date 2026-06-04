import { anthropicAdapter } from "./anthropic";
import { googleGeminiAdapter } from "./google-gemini";
import { openAIAdapter } from "./openai";
import { createOpenAICompatibleAdapter } from "./openai-compatible";
import type { Provider, ProviderAdapter } from "./types";

const adapters: Record<Provider, ProviderAdapter> = {
  openai: openAIAdapter,
  anthropic: anthropicAdapter,
  google_gemini: googleGeminiAdapter,
  xai_grok: createOpenAICompatibleAdapter("xai_grok"),
  deepseek: createOpenAICompatibleAdapter("deepseek"),
  groq: createOpenAICompatibleAdapter("groq"),
  mistral: createOpenAICompatibleAdapter("mistral"),
  openrouter: createOpenAICompatibleAdapter("openrouter"),
  custom_openai_compatible: createOpenAICompatibleAdapter("custom_openai_compatible")
};

export function getProviderAdapter(provider: Provider): ProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter;
}

