import { safeErrorMessage } from "@/lib/security/secret-redaction";
import type { BenchmarkResult, Provider, ProviderRunInput } from "./types";

export class ProviderHttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ data: T; latencyMs: number }> {
  const controller = new AbortController();
  const started = performance.now();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });
    const text = await response.text();
    const latencyMs = Math.round(performance.now() - started);
    const data = text ? (JSON.parse(text) as T & { error?: unknown }) : ({} as T & { error?: unknown });

    if (!response.ok) {
      throw new ProviderHttpError(readProviderError(data as { error?: unknown }, response.statusText), response.status);
    }

    return { data, latencyMs };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ProviderHttpError("Provider request timed out.", 408);
    }
    if (error instanceof ProviderHttpError) {
      throw error;
    }
    throw new ProviderHttpError(safeErrorMessage(error));
  } finally {
    clearTimeout(timeout);
  }
}

export function timeoutResult(input: Pick<ProviderRunInput, "provider" | "model">, latencyMs: number): BenchmarkResult {
  return {
    provider: input.provider,
    model: input.model,
    output: null,
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    latencyMs,
    status: "timeout",
    errorMessage: "Provider request timed out."
  };
}

export function errorResult(
  provider: Provider,
  model: string,
  error: unknown,
  latencyMs: number
): BenchmarkResult {
  const status =
    error instanceof ProviderHttpError && error.status === 408 ? "timeout" : "error";
  return {
    provider,
    model,
    output: null,
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    latencyMs,
    status,
    errorMessage: status === "timeout" ? "Provider request timed out." : safeErrorMessage(error)
  };
}

function readProviderError(data: { error?: unknown }, fallback: string): string {
  const error = data.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback || "Provider request failed.";
}
