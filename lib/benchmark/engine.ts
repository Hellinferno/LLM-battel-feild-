import { prisma } from "@/lib/db/client";
import { getProviderAdapter } from "@/lib/providers/registry";
import type { BenchmarkResult, ModelSelection, Provider } from "@/lib/providers/types";
import { decryptSecret } from "@/lib/security/encryption";
import { getRunStatus } from "./status";
import type { BenchmarkRunInput, OrderedBenchmarkResult } from "./types";

type ProviderCredential = {
  provider: Provider;
  apiKey: string;
  label: string | null;
  baseUrl: string | null;
};

export async function validateBenchmarkKeys(userId: string, models: ModelSelection[]) {
  const credentials = await loadCredentials(userId);
  const missing = models.filter((selection) => !findCredential(credentials, selection));

  if (missing.length > 0) {
    return {
      ok: false as const,
      message: `Missing provider key for ${missing
        .map((item) => `${item.provider}:${item.model}`)
        .join(", ")}.`
    };
  }

  return { ok: true as const };
}

export async function executeBenchmarkRun(runId: string, input: BenchmarkRunInput) {
  const credentials = await loadCredentials(input.userId);

  const resultPromises = input.models.map(async (selection, resultOrder) => {
    const result = await runSelection(input, credentials, selection);
    const ordered: OrderedBenchmarkResult = { ...result, resultOrder };

    await prisma.benchmarkResult.create({
      data: {
        benchmarkRunId: runId,
        provider: ordered.provider,
        model: ordered.model,
        output: ordered.output,
        inputTokens: ordered.inputTokens,
        outputTokens: ordered.outputTokens,
        totalTokens: ordered.totalTokens,
        latencyMs: ordered.latencyMs,
        status: ordered.status,
        errorMessage: ordered.errorMessage,
        resultOrder,
        rawUsage: ordered.rawUsage ? JSON.stringify(ordered.rawUsage) : null
      }
    });

    return ordered;
  });

  const results = await Promise.all(resultPromises);
  const status = getRunStatus(results.map((result) => result.status));

  await prisma.benchmarkRun.update({
    where: { id: runId },
    data: {
      status,
      completedAt: new Date()
    }
  });

  return results.sort((a, b) => a.resultOrder - b.resultOrder);
}

async function runSelection(
  input: BenchmarkRunInput,
  credentials: ProviderCredential[],
  selection: ModelSelection
): Promise<BenchmarkResult> {
  const credential = findCredential(credentials, selection);
  if (!credential) {
    return {
      provider: selection.provider,
      model: selection.model,
      output: null,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      latencyMs: 0,
      status: "error",
      errorMessage: "Provider key is missing."
    };
  }

  const adapter = getProviderAdapter(selection.provider);
  return adapter.run({
    provider: selection.provider,
    model: selection.model,
    apiKey: credential.apiKey,
    baseUrl: selection.baseUrl ?? credential.baseUrl,
    prompt: input.prompt,
    systemInstruction: input.systemInstruction,
    settings: input.settings
  });
}

async function loadCredentials(userId: string): Promise<ProviderCredential[]> {
  const keys = await prisma.providerKey.findMany({
    where: { userId }
  });

  return keys.map((key) => ({
    provider: key.provider as Provider,
    apiKey: decryptSecret(key.encryptedKey),
    label: key.label,
    baseUrl: key.baseUrl
  }));
}

function findCredential(credentials: ProviderCredential[], selection: ModelSelection) {
  if (selection.provider === "custom_openai_compatible") {
    return (
      credentials.find(
        (credential) =>
          credential.provider === selection.provider &&
          (!selection.label || credential.label === selection.label)
      ) ?? credentials.find((credential) => credential.provider === selection.provider)
    );
  }

  return credentials.find((credential) => credential.provider === selection.provider);
}

