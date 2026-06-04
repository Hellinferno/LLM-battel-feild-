import { describe, expect, it } from "vitest";
import {
  anthropicContent,
  geminiParts,
  openAIChatContent,
  openAIResponsesContent
} from "@/lib/providers/multimodal";
import type { ImageInput } from "@/lib/providers/types";

const image: ImageInput = { mimeType: "image/png", data: "QUJD" };

describe("multimodal content builders", () => {
  it("returns a plain string when there are no images", () => {
    expect(openAIResponsesContent("hello", [])).toBe("hello");
    expect(openAIChatContent("hello", undefined)).toBe("hello");
    expect(anthropicContent("hello", [])).toBe("hello");
  });

  it("builds OpenAI Responses content with text and image", () => {
    expect(openAIResponsesContent("describe", [image])).toEqual([
      { type: "input_text", text: "describe" },
      { type: "input_image", image_url: "data:image/png;base64,QUJD" }
    ]);
  });

  it("builds OpenAI Chat content with text and image", () => {
    expect(openAIChatContent("describe", [image])).toEqual([
      { type: "text", text: "describe" },
      { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } }
    ]);
  });

  it("builds Anthropic content with base64 source", () => {
    expect(anthropicContent("describe", [image])).toEqual([
      { type: "text", text: "describe" },
      { type: "image", source: { type: "base64", media_type: "image/png", data: "QUJD" } }
    ]);
  });

  it("builds Gemini parts with inline data", () => {
    expect(geminiParts("describe", [image])).toEqual([
      { text: "describe" },
      { inline_data: { mime_type: "image/png", data: "QUJD" } }
    ]);
  });

  it("omits the text part when the prompt is empty (image-only input)", () => {
    expect(openAIResponsesContent("", [image])).toEqual([
      { type: "input_image", image_url: "data:image/png;base64,QUJD" }
    ]);
    expect(geminiParts("", [image])).toEqual([
      { inline_data: { mime_type: "image/png", data: "QUJD" } }
    ]);
  });
});
