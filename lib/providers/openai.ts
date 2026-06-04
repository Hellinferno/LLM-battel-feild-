import { errorResult, fetchJson } from "./http";
import { openAIResponsesContent } from "./multimodal";
import type { BenchmarkResult, ProviderAdapter, ProviderRunInput } from "./types";

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string; type?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

export const openAIAdapter: ProviderAdapter = {
  provider: "openai",
  async run(input) {
    return runOpenAI(input);
  },
  async testKey(input) {
    const result = await runOpenAI({
      provider: "openai",
      model: input.model || "gpt-4.1-mini",
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

async function runOpenAI(input: ProviderRunInput): Promise<BenchmarkResult> {
  const started = performance.now();

  try {
    const { data, latencyMs } = await fetchJson<ResponsesApiResponse>(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`
        },
        body: JSON.stringify({
          model: input.model,
          input: [
            ...(input.systemInstruction
              ? [{ role: "system", content: input.systemInstruction }]
              : []),
            { role: "user", content: openAIResponsesContent(input.prompt, input.images) }
          ],
          temperature: input.settings.temperature,
          max_output_tokens: input.settings.maxOutputTokens
        })
      },
      input.settings.timeoutMs
    );

    return {
      provider: "openai",
      model: input.model,
      output: data.output_text ?? extractOutputText(data),
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null,
      latencyMs,
      status: "success",
      errorMessage: null,
      rawUsage: data.usage ?? null
    };
  } catch (error) {
    return errorResult("openai", input.model, error, Math.round(performance.now() - started));
  }
}

function extractOutputText(data: ResponsesApiResponse): string {
  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

