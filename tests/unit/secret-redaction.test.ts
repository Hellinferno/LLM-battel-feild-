import { describe, expect, it } from "vitest";
import { redactSecrets, safeErrorMessage } from "@/lib/security/secret-redaction";

describe("secret redaction", () => {
  it("removes common API key shapes from diagnostic text", () => {
    const input = "Authorization: Bearer sk-super-secret-token api_key=xai-private-token";

    expect(redactSecrets(input)).not.toContain("sk-super-secret-token");
    expect(redactSecrets(input)).not.toContain("xai-private-token");
  });

  it("returns bounded safe error messages", () => {
    const message = safeErrorMessage(new Error(`Bearer sk-secret ${"x".repeat(400)}`));

    expect(message.length).toBeLessThanOrEqual(240);
    expect(message).not.toContain("sk-secret");
  });
});

