import { afterEach, describe, expect, it, vi } from "vitest";
import { anthropicAdapter } from "@/lib/providers/anthropic";
import { googleGeminiAdapter } from "@/lib/providers/google-gemini";
import { openAIAdapter } from "@/lib/providers/openai";
import { createOpenAICompatibleAdapter } from "@/lib/providers/openai-compatible";
import type { ProviderRunInput } from "@/lib/providers/types";

const baseInput: ProviderRunInput = {
  provider: "openai",
  model: "test-model",
  apiKey: "sk-test",
  prompt: "Hello",
  systemInstruction: null,
  settings: {
    temperature: 0.2,
    maxOutputTokens: 20,
    timeoutMs: 1000
  }
};

describe("provider normalization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes OpenAI Responses API usage", async () => {
    stubFetch({
      output_text: "OpenAI output",
      usage: { input_tokens: 3, output_tokens: 5, total_tokens: 8 }
    });

    const result = await openAIAdapter.run({ ...baseInput, provider: "openai" });

    expect(result).toMatchObject({
      provider: "openai",
      output: "OpenAI output",
      inputTokens: 3,
      outputTokens: 5,
      totalTokens: 8,
      status: "success"
    });
  });

  it("normalizes Anthropic message usage", async () => {
    stubFetch({
      content: [{ type: "text", text: "Claude output" }],
      usage: { input_tokens: 4, output_tokens: 6 }
    });

    const result = await anthropicAdapter.run({
      ...baseInput,
      provider: "anthropic",
      model: "claude-test"
    });

    expect(result.output).toBe("Claude output");
    expect(result.inputTokens).toBe(4);
    expect(result.outputTokens).toBe(6);
    expect(result.totalTokens).toBe(10);
  });

  it("normalizes Gemini usage metadata", async () => {
    stubFetch({
      candidates: [{ content: { parts: [{ text: "Gemini output" }] } }],
      usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 7, totalTokenCount: 9 }
    });

    const result = await googleGeminiAdapter.run({
      ...baseInput,
      provider: "google_gemini",
      model: "gemini-test"
    });

    expect(result.output).toBe("Gemini output");
    expect(result.totalTokens).toBe(9);
  });

  it("normalizes OpenAI-compatible providers with missing usage as Unknown/null", async () => {
    stubFetch({
      choices: [{ message: { content: "Compatible output" } }]
    });
    const adapter = createOpenAICompatibleAdapter("deepseek");

    const result = await adapter.run({
      ...baseInput,
      provider: "deepseek",
      model: "deepseek-chat"
    });

    expect(result.output).toBe("Compatible output");
    expect(result.inputTokens).toBeNull();
    expect(result.outputTokens).toBeNull();
    expect(result.totalTokens).toBeNull();
  });

  it("converts provider failures into safe error results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: { message: "invalid_api_key sk-secret" } }), { status: 401 }))
    );

    const result = await openAIAdapter.run({ ...baseInput, provider: "openai" });

    expect(result.status).toBe("error");
    expect(result.output).toBeNull();
    expect(result.errorMessage).not.toContain("sk-secret");
  });

  it("supports every OpenAI-compatible provider family", async () => {
    const providers = ["xai_grok", "deepseek", "groq", "mistral", "openrouter"] as const;

    for (const provider of providers) {
      stubFetch({
        choices: [{ message: { content: `${provider} output` } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }
      });
      const adapter = createOpenAICompatibleAdapter(provider);
      const result = await adapter.run({ ...baseInput, provider, model: "family-test" });

      expect(result.provider).toBe(provider);
      expect(result.totalTokens).toBe(3);
    }
  });
});

function stubFetch(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }))
  );
}

