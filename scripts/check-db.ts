import { prisma } from "@/lib/db/prisma";
import { checkDatabaseReadiness } from "@/lib/system/database-readiness";

async function main() {
  const readiness = await checkDatabaseReadiness();

  console.log(JSON.stringify(readiness, null, 2));

  await prisma.$disconnect();

  if (!readiness.ok) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
