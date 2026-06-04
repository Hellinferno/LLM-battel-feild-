CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "ProviderKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT,
    "baseUrl" TEXT,
    "encryptedKey" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'untested',
    "lastTestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "supportsTemperature" BOOLEAN NOT NULL DEFAULT true,
    "supportsMaxOutputTokens" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "BenchmarkRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "systemInstruction" TEXT,
    "settings" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "selectedModels" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "BenchmarkRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BenchmarkResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benchmarkRunId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "output" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "resultOrder" INTEGER NOT NULL,
    "rawUsage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BenchmarkResult_benchmarkRunId_fkey" FOREIGN KEY ("benchmarkRunId") REFERENCES "BenchmarkRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "ProviderKey_userId_provider_idx" ON "ProviderKey"("userId", "provider");
CREATE UNIQUE INDEX IF NOT EXISTS "ProviderKey_userId_provider_label_key" ON "ProviderKey"("userId", "provider", "label");
CREATE INDEX IF NOT EXISTS "ModelConfig_provider_isActive_idx" ON "ModelConfig"("provider", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "ModelConfig_provider_model_key" ON "ModelConfig"("provider", "model");
CREATE INDEX IF NOT EXISTS "BenchmarkRun_userId_createdAt_idx" ON "BenchmarkRun"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "BenchmarkResult_benchmarkRunId_resultOrder_idx" ON "BenchmarkResult"("benchmarkRunId", "resultOrder");
CREATE INDEX IF NOT EXISTS "BenchmarkResult_provider_model_idx" ON "BenchmarkResult"("provider", "model");
CREATE UNIQUE INDEX IF NOT EXISTS "BenchmarkResult_benchmarkRunId_resultOrder_key" ON "BenchmarkResult"("benchmarkRunId", "resultOrder");

