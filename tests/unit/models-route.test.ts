import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODELS } from "@/lib/providers/catalog";

const { getCurrentUserMock, prismaMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  prismaMock: {
    modelConfig: {
      findMany: vi.fn()
    },
    providerKey: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/db/client", () => ({
  prisma: prismaMock
}));

const { GET } = await import("@/app/api/models/route");

describe("GET /api/models", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns saved models and enables providers with saved keys", async () => {
    prismaMock.modelConfig.findMany.mockResolvedValue([
      {
        provider: "anthropic",
        model: "claude-test",
        displayName: "Claude Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: false
      },
      {
        provider: "openai",
        model: "gpt-test",
        displayName: "GPT Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: true
      }
    ]);
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    prismaMock.providerKey.findMany.mockResolvedValue([{ provider: "openai" }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.models).toEqual([
      {
        provider: "anthropic",
        providerLabel: "Anthropic Claude",
        model: "claude-test",
        displayName: "Claude Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: false,
        enabled: false
      },
      {
        provider: "openai",
        providerLabel: "OpenAI ChatGPT",
        model: "gpt-test",
        displayName: "GPT Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: true,
        enabled: true
      }
    ]);
  });

  it("returns disabled default models when database model lookup fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.modelConfig.findMany.mockRejectedValue(new Error("database is not initialized"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.models).toHaveLength(DEFAULT_MODELS.length);
    expect(body.models.every((model: { enabled: boolean }) => model.enabled === false)).toBe(true);
    expect(getCurrentUserMock).not.toHaveBeenCalled();
    expect(prismaMock.providerKey.findMany).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("returns saved models as disabled when provider key lookup fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.modelConfig.findMany.mockResolvedValue([
      {
        provider: "openai",
        model: "gpt-test",
        displayName: "GPT Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: true
      }
    ]);
    getCurrentUserMock.mockRejectedValue(new Error("user table is not initialized"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.models).toEqual([
      {
        provider: "openai",
        providerLabel: "OpenAI ChatGPT",
        model: "gpt-test",
        displayName: "GPT Test",
        supportsTemperature: true,
        supportsMaxOutputTokens: true,
        enabled: false
      }
    ]);

    consoleErrorSpy.mockRestore();
  });
});
