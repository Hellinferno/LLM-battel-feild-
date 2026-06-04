import type { ImageInput } from "./types";

export function hasImages(images?: ImageInput[]): images is ImageInput[] {
  return Array.isArray(images) && images.length > 0;
}

export function toDataUrl(image: ImageInput): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

/** Content for the OpenAI Responses API (`/v1/responses`). */
export function openAIResponsesContent(prompt: string, images?: ImageInput[]) {
  if (!hasImages(images)) {
    return prompt;
  }
  return [
    ...(prompt ? [{ type: "input_text", text: prompt }] : []),
    ...images.map((image) => ({ type: "input_image", image_url: toDataUrl(image) }))
  ];
}

/** Content for OpenAI-compatible Chat Completions (`/chat/completions`). */
export function openAIChatContent(prompt: string, images?: ImageInput[]) {
  if (!hasImages(images)) {
    return prompt;
  }
  return [
    ...(prompt ? [{ type: "text", text: prompt }] : []),
    ...images.map((image) => ({ type: "image_url", image_url: { url: toDataUrl(image) } }))
  ];
}

/** Content for the Anthropic Messages API. */
export function anthropicContent(prompt: string, images?: ImageInput[]) {
  if (!hasImages(images)) {
    return prompt;
  }
  return [
    ...(prompt ? [{ type: "text", text: prompt }] : []),
    ...images.map((image) => ({
      type: "image",
      source: { type: "base64", media_type: image.mimeType, data: image.data }
    }))
  ];
}

/** Parts for the Google Gemini `generateContent` API. */
export function geminiParts(prompt: string, images?: ImageInput[]) {
  return [
    ...(prompt ? [{ text: prompt }] : []),
    ...(hasImages(images)
      ? images.map((image) => ({ inline_data: { mime_type: image.mimeType, data: image.data } }))
      : [])
  ];
}
