import type { ResultStatus, RunStatus } from "@/lib/providers/types";

export function getRunStatus(statuses: ResultStatus[]): RunStatus {
  if (statuses.length === 0) {
    return "failed";
  }

  const successCount = statuses.filter((status) => status === "success").length;
  const failedCount = statuses.length - successCount;

  if (successCount === statuses.length) {
    return "completed";
  }

  if (successCount > 0 && failedCount > 0) {
    return "completed_with_errors";
  }

  return "failed";
}

