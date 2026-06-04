import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api/responses";
import { mapProviderKey } from "@/lib/api/mappers";
import { providerKeyCreateSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/db/client";
import { PROVIDER_LABELS } from "@/lib/providers/catalog";
import { encryptSecret, keyHint } from "@/lib/security/encryption";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const providerKeys = await prisma.providerKey.findMany({
      where: { userId: user.id },
      orderBy: [{ provider: "asc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ providerKeys: providerKeys.map(mapProviderKey) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = providerKeyCreateSchema.parse(await request.json());
    const label =
      body.provider === "custom_openai_compatible"
        ? body.label ?? "Custom endpoint"
        : PROVIDER_LABELS[body.provider];

    const existing = await prisma.providerKey.findFirst({
      where: {
        userId: user.id,
        provider: body.provider,
        label
      }
    });

    const data = {
      userId: user.id,
      provider: body.provider,
      label,
      baseUrl: body.baseUrl ?? null,
      encryptedKey: encryptSecret(body.apiKey),
      keyHint: keyHint(body.apiKey),
      status: "untested"
    };

    const saved = existing
      ? await prisma.providerKey.update({
          where: { id: existing.id },
          data
        })
      : await prisma.providerKey.create({ data });

    return NextResponse.json(mapProviderKey(saved), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

