import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";
import { DEFAULT_MODELS, PROVIDER_LABELS } from "@/lib/providers/catalog";
import type { Provider } from "@/lib/providers/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const [savedModels, keys] = await Promise.all([
      prisma.modelConfig.findMany({
        where: { isActive: true },
        orderBy: [{ provider: "asc" }, { displayName: "asc" }]
      }),
      prisma.providerKey.findMany({
        where: { userId: user.id }
      })
    ]);

    const models = savedModels.length > 0 ? savedModels : DEFAULT_MODELS;
    const keyProviders = new Set(keys.map((key) => key.provider));

    return NextResponse.json({
      models: models.map((model) => ({
        provider: model.provider,
        providerLabel: PROVIDER_LABELS[model.provider as Provider],
        model: model.model,
        displayName: model.displayName,
        supportsTemperature: model.supportsTemperature,
        supportsMaxOutputTokens: model.supportsMaxOutputTokens,
        enabled: keyProviders.has(model.provider)
      }))
    });
  } catch (error) {
    return apiError(error);
  }
}

