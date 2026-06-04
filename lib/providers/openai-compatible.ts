import { errorResult, fetchJson } from "./http";
import type { BenchmarkResult, Provider, ProviderAdapter, ProviderRunInput } from "./types";

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
    text?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
};

const BASE_URLS: Partial<Record<Provider, string>> = {
  xai_grok: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
  openrouter: "https://openrouter.ai/api/v1"
};

export function createOpenAICompatibleAdapter(provider: Provider): ProviderAdapter {
  return {
    provider,
    async run(input) {
      return runOpenAICompatible(input);
    },
    async testKey(input) {
      const model = input.model || "model-test";
      const result = await runOpenAICompatible({
        provider,
        model,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        prompt: "Reply with ok.",
        systemInstruction: null,
        settings: { timeoutMs: 15000, maxOutputTokens: 8, temperature: 0 }
      });
      return result.status === "success"
        ? { status: "connected", message: "Provider key is valid." }
        : { status: "failed", message: result.errorMessage ?? "Provider key test failed." };
    }
  };
}

async function runOpenAICompatible(input: ProviderRunInput): Promise<BenchmarkResult> {
  const baseUrl = normalizeBaseUrl(input.baseUrl || BASE_URLS[input.provider]);
  const started = performance.now();

  try {
    const { data, latencyMs } = await fetchJson<ChatResponse>(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          ...(input.provider === "openrouter"
            ? {
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
                "X-Title": "LLM Battle"
              }
            : {})
        },
        body: JSON.stringify({
          model: input.model,
          messages: [
            ...(input.systemInstruction
              ? [{ role: "system", content: input.systemInstruction }]
              : []),
            { role: "user", content: input.prompt }
          ],
          temperature: input.settings.temperature,
          max_tokens: input.settings.maxOutputTokens
        })
      },
      input.settings.timeoutMs
    );

    return {
      provider: input.provider,
      model: input.model,
      output: extractChatText(data),
      inputTokens: data.usage?.prompt_tokens ?? data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? data.usage?.output_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null,
      latencyMs,
      status: "success",
      errorMessage: null,
      rawUsage: data.usage ?? null
    };
  } catch (error) {
    return errorResult(input.provider, input.model, error, Math.round(performance.now() - started));
  }
}

function normalizeBaseUrl(baseUrl?: string | null): string {
  if (!baseUrl) {
    throw new Error("A base URL is required for this provider.");
  }
  return baseUrl.replace(/\/+$/, "");
}

function extractChatText(data: ChatResponse): string {
  const content = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? "";
  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? "").join("").trim();
  }
  return String(content).trim();
}

