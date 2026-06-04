import { z } from "zod";
import { PROVIDERS } from "@/lib/providers/types";

export const providerSchema = z.enum(PROVIDERS);

export const providerKeyCreateSchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(4),
  label: z.string().trim().min(1).max(80).optional(),
  baseUrl: z.string().url().optional()
});

export const benchmarkRunCreateSchema = z.object({
  prompt: z.string().trim().min(1).max(20000),
  systemInstruction: z.string().trim().max(5000).nullable().optional(),
  settings: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxOutputTokens: z.number().int().min(1).max(32000).optional(),
    timeoutMs: z.number().int().min(1000).max(180000).default(60000)
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
    .min(1)
    .max(20)
});

