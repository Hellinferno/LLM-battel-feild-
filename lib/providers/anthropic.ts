import { errorResult, fetchJson } from "./http";
import { anthropicContent } from "./multimodal";
import type { BenchmarkResult, ProviderAdapter, ProviderRunInput } from "./types";

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export const anthropicAdapter: ProviderAdapter = {
  provider: "anthropic",
  async run(input) {
    return runAnthropic(input);
  },
  async testKey(input) {
    const result = await runAnthropic({
      provider: "anthropic",
      model: input.model || "claude-3-5-sonnet-latest",
      apiKey: input.apiKey,
      prompt: "Reply with ok.",
      systemInstruction: null,
      settings: { timeoutMs: 15000, maxOutputTokens: 8, temperature: 0 }
    });
    return result.status === "success"
      ? { status: "connected", message: "Provider key is valid." }
      : { status: "failed", message: result.errorMessage ?? "Provider key test failed." };
  },
  async listModels(input) {
    const { data } = await fetchJson<{ data?: Array<{ id: string; display_name?: string }> }>(
      "https://api.anthropic.com/v1/models?limit=1000",
      {
        method: "GET",
        headers: { "x-api-key": input.apiKey, "anthropic-version": "2023-06-01" }
      },
      20000
    );
    return (data.data ?? []).map((item) => ({ id: item.id, displayName: item.display_name }));
  }
};

async function runAnthropic(input: ProviderRunInput): Promise<BenchmarkResult> {
  const started = performance.now();

  try {
    const { data, latencyMs } = await fetchJson<AnthropicResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": input.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: input.model,
          system: input.systemInstruction ?? undefined,
          messages: [{ role: "user", content: anthropicContent(input.prompt, input.images) }],
          temperature: input.settings.temperature,
          max_tokens: input.settings.maxOutputTokens ?? 1024
        })
      },
      input.settings.timeoutMs
    );

    const inputTokens = data.usage?.input_tokens ?? null;
    const outputTokens = data.usage?.output_tokens ?? null;
    return {
      provider: "anthropic",
      model: input.model,
      output: data.content?.map((part) => part.text ?? "").join("").trim() ?? "",
      inputTokens,
      outputTokens,
      totalTokens: inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null,
      latencyMs,
      status: "success",
      errorMessage: null,
      rawUsage: data.usage ?? null
    };
  } catch (error) {
    return errorResult("anthropic", input.model, error, Math.round(performance.now() - started));
  }
}

