import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const key = await prisma.providerKey.findFirst({
      where: { id, userId: user.id }
    });

    if (!key) {
      return apiError(new Error("Provider key not found."), 404);
    }

    await prisma.providerKey.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}

