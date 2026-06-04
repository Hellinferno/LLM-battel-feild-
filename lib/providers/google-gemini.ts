import { errorResult, fetchJson } from "./http";
import type { BenchmarkResult, ProviderAdapter, ProviderRunInput } from "./types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
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
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            temperature: input.settings.temperature,
            maxOutputTokens: input.settings.maxOutputTokens
          }
        })
      },
      input.settings.timeoutMs
    );

    return {
      provider: "google_gemini",
      model: input.model,
      output:
        data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "",
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      totalTokens: data.usageMetadata?.totalTokenCount ?? null,
      latencyMs,
      status: "success",
      errorMessage: null,
      rawUsage: data.usageMetadata ?? null
    };
  } catch (error) {
    return errorResult("google_gemini", input.model, error, Math.round(performance.now() - started));
  }
}

