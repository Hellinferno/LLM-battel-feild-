import { errorResult, fetchJson } from "./http";
import { geminiParts } from "./multimodal";
import type { BenchmarkResult, ProviderAdapter, ProviderRunInput } from "./types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
  };
};

export const googleGeminiAdapter: ProviderAdapter = {
  provider: "google_gemini",
  async run(input) {
    return runGemini(input);
  },
  async testKey(input) {
    const result = await runGemini({
      provider: "google_gemini",
      model: input.model || "gemini-1.5-flash",
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(
      input.apiKey
    )}`;
    const { data } = await fetchJson<{
      models?: Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }>;
    }>(url, { method: "GET" }, 20000);
    return (data.models ?? [])
      .filter((item) => item.supportedGenerationMethods?.includes("generateContent"))
      .map((item) => ({ id: item.name.replace(/^models\//, ""), displayName: item.displayName }));
  }
};

async function runGemini(input: ProviderRunInput): Promise<BenchmarkResult> {
  const started = performance.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    input.model
  )}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

  try {
    const { data, latencyMs } = await fetchJson<GeminiResponse>(
      url,
      {
        method: "POST",
        body: JSON.stringify({
          systemInstruction: input.systemInstruction
            ? { parts: [{ text: input.systemInstruction }] }
            : undefined,
          contents: [{ role: "user", parts: geminiParts(input.prompt, input.images) }],
          generationConfig: {
            temperature: input.settings.temperature,
            maxOutputTokens: input.settings.maxOutputTokens
          }
        })
      },
      input.settings.timeoutMs
    );

    const candidate = data.candidates?.[0];
    const output =
      candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    const finishReason = candidate?.finishReason ?? null;
    const thoughts = data.usageMetadata?.thoughtsTokenCount ?? 0;

    // Reasoning models (gemini-2.5-pro especially) can spend the full
    // maxOutputTokens on internal thinking, returning empty visible text. Flag
    // that explicitly so it doesn't look like a silent failure.
    const emptyButFinished = output.length === 0 && finishReason !== null;
    const hitCap = finishReason === "MAX_TOKENS";

    return {
      provider: "google_gemini",
      model: input.model,
      output,
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: data.usageMetadata?.totalTokenCount ?? null,
      latencyMs,
      status: emptyButFinished ? "error" : "success",
      errorMessage: emptyButFinished
        ? hitCap
          ? `Empty output — model hit maxOutputTokens (${
              data.usageMetadata?.candidatesTokenCount ?? "?"
            } answer / ${thoughts} thinking tokens). Try raising maxOutputTokens.`
          : `Empty output — finishReason: ${finishReason}.`
        : null,
      rawUsage: data.usageMetadata ?? null
    };
  } catch (error) {
    return errorResult("google_gemini", input.model, error, Math.round(performance.now() - started));
  }
}

