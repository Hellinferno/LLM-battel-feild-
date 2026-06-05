import { z } from "zod";
import { PROVIDERS } from "@/lib/providers/types";

export const providerSchema = z.enum(PROVIDERS);

export const providerKeyCreateSchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(4),
  label: z.string().trim().min(1).max(80).optional(),
  baseUrl: z.string().url().optional()
});

export const imageInputSchema = z.object({
  mimeType: z
    .string()
    .regex(/^image\/(png|jpe?g|webp|gif)$/, "Unsupported image type."),
  // Base64 payload (no data: prefix). ~20MB ceiling on the encoded string.
  data: z.string().min(1).max(20_000_000)
});

export const benchmarkRunCreateSchema = z
  .object({
    prompt: z.string().trim().max(500000).default(""),
    images: z.array(imageInputSchema).max(8).default([]),
    systemInstruction: z.string().trim().max(5000).nullable().optional(),
    settings: z.object({
      temperature: z.number().min(0).max(2).optional(),
      maxOutputTokens: z.number().int().min(1).max(32000).optional(),
      // Server-owned deadline. Capped below the route's maxDuration (300s) with
      // headroom for the per-result DB writes and JSON encoding, so a slow run
      // finishes before the platform kills the function.
      timeoutMs: z.number().int().min(1000).max(285000).default(280000)
    }),
    models: z
      .array(
        z.object({
          provider: providerSchema,
          model: z.string().trim().min(1).max(200),
          label: z.string().trim().min(1).max(80).nullable().optional(),
          baseUrl: z.string().url().nullable().optional()
        })
      )
      // Bounds fan-out: providers run in parallel, so this caps concurrent
      // outbound requests and DB writes per run.
      .min(1)
      .max(20)
  })
  .refine((value) => value.prompt.length > 0 || value.images.length > 0, {
    message: "Provide a prompt, an image, or both.",
    path: ["prompt"]
  });

