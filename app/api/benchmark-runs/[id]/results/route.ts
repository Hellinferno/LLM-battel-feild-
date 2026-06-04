import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { mapBenchmarkResult } from "@/lib/api/mappers";
import { apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const run = await prisma.benchmarkRun.findFirst({
      where: { id, userId: user.id },
      include: {
        results: {
          orderBy: { resultOrder: "asc" }
        }
      }
    });

    if (!run) {
      return apiError(new Error("Benchmark run not found."), 404);
    }

    return NextResponse.json({
      runId: run.id,
      results: run.results.map(mapBenchmarkResult)
    });
  } catch (error) {
    return apiError(error);
  }
}

