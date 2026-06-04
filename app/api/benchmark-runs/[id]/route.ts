import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { mapBenchmarkRun } from "@/lib/api/mappers";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const run = await prisma.benchmarkRun.findFirst({
      where: { id, userId: user.id }
    });

    if (!run) {
      return apiError(new Error("Benchmark run not found."), 404);
    }

    return NextResponse.json(mapBenchmarkRun(run));
  } catch (error) {
    return apiError(error);
  }
}

