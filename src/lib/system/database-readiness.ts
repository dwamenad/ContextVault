import { prisma } from "@/lib/db/prisma";

export type ReadinessCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type DatabaseReadiness = {
  ok: boolean;
  databaseUrlPresent: boolean;
  checks: ReadinessCheck[];
  counts: {
    users: number;
    vaults: number;
    projects: number;
    documents: number;
    chunks: number;
    mcpResources: number;
  } | null;
  nextSteps: string[];
};

type ExistsRow = { exists: boolean };

async function exists(query: string) {
  const rows = await prisma.$queryRawUnsafe<ExistsRow[]>(query);
  return Boolean(rows[0]?.exists);
}

export async function checkDatabaseReadiness(): Promise<DatabaseReadiness> {
  const checks: ReadinessCheck[] = [];
  const nextSteps: string[] = [];
  const databaseUrlPresent = Boolean(process.env.DATABASE_URL);

  if (!databaseUrlPresent) {
    checks.push({ name: "DATABASE_URL", ok: false, detail: "DATABASE_URL is not set." });
    nextSteps.push("Copy .env.example to .env and set DATABASE_URL.");
    return { ok: false, databaseUrlPresent, checks, counts: null, nextSteps };
  }

  checks.push({ name: "DATABASE_URL", ok: true, detail: "DATABASE_URL is set." });

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "Postgres connection", ok: true, detail: "Connected to Postgres." });
  } catch (error) {
    checks.push({
      name: "Postgres connection",
      ok: false,
      detail: error instanceof Error ? error.message : "Unable to connect to Postgres.",
    });
    nextSteps.push("Start Postgres with pgvector, for example: docker compose up -d.");
    return { ok: false, databaseUrlPresent, checks, counts: null, nextSteps };
  }

  try {
    const vectorInstalled = await exists("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS exists");
    checks.push({
      name: "pgvector extension",
      ok: vectorInstalled,
      detail: vectorInstalled ? "pgvector extension is installed." : "pgvector extension is not installed in this database.",
    });
    if (!vectorInstalled) {
      nextSteps.push("Use the pgvector Docker image from docker-compose.yml or install pgvector into the local Postgres server.");
    }
  } catch (error) {
    checks.push({
      name: "pgvector extension",
      ok: false,
      detail: error instanceof Error ? error.message : "Could not inspect pgvector extension.",
    });
  }

  const tableChecks = await Promise.all(
    ["User", "Team", "Vault", "Project", "Document", "DocumentVersion", "Chunk", "McpResource"].map(async (table) => ({
      table,
      ok: await exists(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}') AS exists`),
    })),
  );

  const missingTables = tableChecks.filter((check) => !check.ok).map((check) => check.table);
  checks.push({
    name: "Prisma tables",
    ok: missingTables.length === 0,
    detail: missingTables.length === 0 ? "Required tables exist." : `Missing tables: ${missingTables.join(", ")}.`,
  });
  if (missingTables.length) nextSteps.push("Run npm run db:migrate.");

  let counts: DatabaseReadiness["counts"] = null;
  if (!missingTables.length) {
    const [users, vaults, projects, documents, chunks, mcpResources] = await Promise.all([
      prisma.user.count(),
      prisma.vault.count(),
      prisma.project.count(),
      prisma.document.count(),
      prisma.chunk.count(),
      prisma.mcpResource.count(),
    ]);
    counts = { users, vaults, projects, documents, chunks, mcpResources };
    const seeded = vaults > 0 && projects > 0 && documents > 0 && chunks > 0;
    checks.push({
      name: "Seeded demo data",
      ok: seeded,
      detail: seeded ? "Demo data and chunks are present." : "Demo data or chunks are missing.",
    });
    if (!seeded) nextSteps.push("Run npm run db:seed.");
  }

  const ok = checks.every((check) => check.ok);
  if (ok) {
    nextSteps.push("Open /dashboard and verify the fallback banner is gone.");
    nextSteps.push("Ask a question on /projects/{projectId}/ask and confirm retrieval logs are written.");
  }

  return { ok, databaseUrlPresent, checks, counts, nextSteps };
}
