import type { BenchmarkResult as DbBenchmarkResult, BenchmarkRun, ProviderKey } from "@prisma/client";
import type { BenchmarkResult, Provider } from "@/lib/providers/types";

export function mapProviderKey(key: ProviderKey) {
  return {
    id: key.id,
    provider: key.provider,
    label: key.label,
    baseUrl: key.baseUrl,
    keyHint: key.keyHint,
    status: key.status,
    createdAt: key.createdAt.toISOString(),
    lastTestedAt: key.lastTestedAt?.toISOString() ?? null
  };
}

export function mapBenchmarkRun(run: BenchmarkRun) {
  return {
    id: run.id,
    prompt: run.prompt,
    systemInstruction: run.systemInstruction,
    settings: JSON.parse(run.settings) as unknown,
    status: run.status,
    selectedModels: JSON.parse(run.selectedModels) as unknown,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null
  };
}

export function mapBenchmarkResult(result: DbBenchmarkResult): BenchmarkResult {
  return {
    provider: result.provider as Provider,
    model: result.model,
    output: result.output,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    totalTokens: result.totalTokens,
    latencyMs: result.latencyMs,
    status: result.status as BenchmarkResult["status"],
    errorMessage: result.errorMessage,
    rawUsage: result.rawUsage ? JSON.parse(result.rawUsage) : null
  };
}

