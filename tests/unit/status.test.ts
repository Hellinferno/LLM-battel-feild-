import { describe, expect, it } from "vitest";
import { getRunStatus } from "@/lib/benchmark/status";

describe("run status calculation", () => {
  it("marks all successful results as completed", () => {
    expect(getRunStatus(["success", "success"])).toBe("completed");
  });

  it("marks mixed results as completed_with_errors", () => {
    expect(getRunStatus(["success", "timeout", "error"])).toBe("completed_with_errors");
  });

  it("marks all failed results as failed", () => {
    expect(getRunStatus(["timeout", "error"])).toBe("failed");
  });
});

