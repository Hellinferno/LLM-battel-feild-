import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { mapBenchmarkRun } from "@/lib/api/mappers";
import { apiError } from "@/lib/api/responses";
import { benchmarkRunCreateSchema } from "@/lib/api/schemas";
import { executeBenchmarkRun, validateBenchmarkKeys } from "@/lib/benchmark/engine";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");

    const runs = await prisma.benchmarkRun.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(provider
          ? {
              results: {
                some: { provider }
              }
            }
          : {})
      },
      include: { results: true },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json({
      runs: runs.map((run) => {
        const successCount = run.results.filter((result) => result.status === "success").length;
        const errorCount = run.results.filter((result) => result.status === "error").length;
        const timeoutCount = run.results.filter((result) => result.status === "timeout").length;
        const averageLatencyMs =
          run.results.length === 0
            ? 0
            : Math.round(
                run.results.reduce((total, result) => total + result.latencyMs, 0) /
                  run.results.length
              );

        return {
          id: run.id,
          promptPreview: run.prompt.slice(0, 120),
          status: run.status,
          providerCount: run.results.length,
          successCount,
          errorCount,
          timeoutCount,
          averageLatencyMs,
          createdAt: run.createdAt.toISOString()
        };
      })
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = benchmarkRunCreateSchema.parse(await request.json());
    const input = {
      userId: user.id,
      prompt: body.prompt,
      systemInstruction: body.systemInstruction ?? null,
      settings: body.settings,
      models: body.models,
      images: body.images
    };

    const keyCheck = await validateBenchmarkKeys(user.id, body.models);
    if (!keyCheck.ok) {
      return apiError(new Error(keyCheck.message), 400);
    }

    const run = await prisma.benchmarkRun.create({
      data: {
        userId: user.id,
        prompt: input.prompt,
        systemInstruction: input.systemInstruction,
        settings: JSON.stringify(input.settings),
        status: "running",
        selectedModels: JSON.stringify(input.models)
      }
    });

    await executeBenchmarkRun(run.id, input);

    const saved = await prisma.benchmarkRun.findUniqueOrThrow({
      where: { id: run.id }
    });

    return NextResponse.json(mapBenchmarkRun(saved), { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}

