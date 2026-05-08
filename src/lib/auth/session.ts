import { prisma } from "@/lib/db/prisma";

export async function getMockSession() {
  const user = await prisma.user.findFirst({ where: { email: "pi@smithlab.test" } });
  return { userId: user?.id ?? null, role: "PI" as const };
}
