import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, keyHint } from "@/lib/security/encryption";

describe("secret encryption", () => {
  it("round-trips provider keys without storing plaintext", () => {
    const encrypted = encryptSecret("sk-test-secret-1234");

    expect(encrypted).not.toContain("sk-test-secret-1234");
    expect(decryptSecret(encrypted)).toBe("sk-test-secret-1234");
  });

  it("returns a safe key hint", () => {
    expect(keyHint("sk-test-secret-1234")).toBe("1234");
  });
});

