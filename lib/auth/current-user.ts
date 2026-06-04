import { prisma } from "@/lib/db/client";

const LOCAL_USER_EMAIL = "local@llm-battle.dev";

export async function getCurrentUser() {
  return prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {},
    create: {
      email: LOCAL_USER_EMAIL,
      name: "Local User"
    }
  });
}

