import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";
import { getDefaultModel } from "@/lib/providers/catalog";
import { getProviderAdapter } from "@/lib/providers/registry";
import type { Provider } from "@/lib/providers/types";
import { decryptSecret } from "@/lib/security/encryption";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const key = await prisma.providerKey.findFirst({
      where: { id, userId: user.id }
    });

    if (!key) {
      return apiError(new Error("Provider key not found."), 404);
    }

    const provider = key.provider as Provider;
    const adapter = getProviderAdapter(provider);
    const result = await adapter.testKey({
      apiKey: decryptSecret(key.encryptedKey),
      baseUrl: key.baseUrl,
      model: getDefaultModel(provider)
    });

    const updated = await prisma.providerKey.update({
      where: { id },
      data: {
        status: result.status,
        lastTestedAt: new Date()
      }
    });

    return NextResponse.json({
      provider,
      status: updated.status,
      message: result.message,
      lastTestedAt: updated.lastTestedAt?.toISOString() ?? null
    });
  } catch (error) {
    return apiError(error);
  }
}

