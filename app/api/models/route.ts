import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { DEFAULT_MODELS, PROVIDER_LABELS } from "@/lib/providers/catalog";
import { safeErrorMessage } from "@/lib/security/secret-redaction";
import type { ModelConfigSeed, Provider } from "@/lib/providers/types";

export const runtime = "nodejs";

type ModelListItem = Omit<Pick<
  ModelConfigSeed,
  "provider" | "model" | "displayName" | "supportsTemperature" | "supportsMaxOutputTokens"
>, "provider"> & {
  provider: string;
};

function mapModels(models: ModelListItem[], keyProviders = new Set<string>()) {
  return models.map((model) => ({
    provider: model.provider,
    providerLabel: PROVIDER_LABELS[model.provider as Provider],
    model: model.model,
    displayName: model.displayName,
    supportsTemperature: model.supportsTemperature,
    supportsMaxOutputTokens: model.supportsMaxOutputTokens,
    enabled: keyProviders.has(model.provider)
  }));
}

function logDegradedMode(reason: string, error: unknown) {
  console.error(`[api/models] ${reason}; returning degraded model list`, {
    error: safeErrorMessage(error)
  });
}

export async function GET() {
  let models: ModelListItem[];

  try {
    const savedModels = await prisma.modelConfig.findMany({
      where: { isActive: true },
      orderBy: [{ provider: "asc" }, { displayName: "asc" }]
    });

    models = savedModels.length > 0 ? savedModels : DEFAULT_MODELS;
  } catch (error) {
    logDegradedMode("model lookup failed", error);
    return NextResponse.json({
      models: mapModels(DEFAULT_MODELS)
    });
  }

  try {
    const user = await getCurrentUser();
    const keys = await prisma.providerKey.findMany({
      where: { userId: user.id }
    });
    const keyProviders = new Set(keys.map((key) => key.provider));

    return NextResponse.json({ models: mapModels(models, keyProviders) });
  } catch (error) {
    logDegradedMode("provider key lookup failed", error);
    return NextResponse.json({ models: mapModels(models) });
  }
}
