import { PrismaClient } from "@prisma/client";
import { DEFAULT_MODELS } from "../lib/providers/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const model of DEFAULT_MODELS) {
    await prisma.modelConfig.upsert({
      where: {
        provider_model: {
          provider: model.provider,
          model: model.model
        }
      },
      update: {
        displayName: model.displayName,
        supportsTemperature: model.supportsTemperature,
        supportsMaxOutputTokens: model.supportsMaxOutputTokens,
        isActive: true
      },
      create: model
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

