import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";
import { PROVIDER_LABELS } from "@/lib/providers/catalog";
import { getProviderAdapter } from "@/lib/providers/registry";
import type { Provider } from "@/lib/providers/types";
import { decryptSecret } from "@/lib/security/encryption";
import { safeErrorMessage } from "@/lib/security/secret-redaction";

export const runtime = "nodejs";

type ProviderModelGroup = {
  provider: Provider;
  providerLabel: string;
  label: string | null;
  models: Array<{ provider: Provider; model: string; displayName: string }>;
  error: string | null;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    const keys = await prisma.providerKey.findMany({
      where: { userId: user.id },
      orderBy: [{ provider: "asc" }, { createdAt: "asc" }]
    });

    const groups = await Promise.all(
      keys.map(async (key): Promise<ProviderModelGroup> => {
        const provider = key.provider as Provider;
        const base = {
          provider,
          providerLabel: PROVIDER_LABELS[provider],
          label: key.label
        };

        const adapter = getProviderAdapter(provider);
        if (!adapter.listModels) {
          return { ...base, models: [], error: "Listing models is not supported for this provider." };
        }

        try {
          const models = await adapter.listModels({
            apiKey: decryptSecret(key.encryptedKey),
            baseUrl: key.baseUrl
          });
          const sorted = models
            .map((item) => ({
              provider,
              model: item.id,
              displayName: item.displayName?.trim() || item.id
            }))
            .sort((a, b) => a.model.localeCompare(b.model));
          return { ...base, models: sorted, error: null };
        } catch (error) {
          return { ...base, models: [], error: safeErrorMessage(error) };
        }
      })
    );

    return NextResponse.json({ providers: groups });
  } catch (error) {
    return apiError(error);
  }
}
