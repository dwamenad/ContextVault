# ContextVault MCP

ContextVault MCP is a private, governed knowledge layer for research labs and small technical teams. It turns documents, notes, scripts, PDFs, analysis plans, and project files into permission-aware, citation-grade context for AI agents.

The MVP is built around a neuroscience lab project, **AdView Gambling Ads**, and focuses on MCP Resources first: versioned project documents are exposed through stable `contextvault://...` URIs and read through resource listing/read endpoints.

## Why It Exists

Research teams often have messy context: preregistrations, analysis plans, model READMEs, scripts, meeting notes, and public summaries all disagree or age at different rates. Generic “chat with docs” apps do not know which document is authoritative, which version is current, or what a collaborator is allowed to see. ContextVault adds provenance, authority labels, role views, and citations before AI agents consume project context.

## MVP Features

- Team vaults and projects.
- Manual text creation and file upload ingestion.
- Text extraction for `.txt`, `.md`, `.pdf`, `.docx`, `.csv`, and common code/script files.
- Document versions, latest-version tracking, text hashes, chunks, and embeddings.
- OpenAI embedding/chat provider isolation with deterministic local fallback when no API key is set.
- Role-based visibility filtering enforced server-side.
- Authority ranking: `AUTHORITATIVE > SUPPORTING > DRAFT > SCRATCH > DEPRECATED`.
- Citation-backed project Q&A and claim tracing.
- Version comparison with diff and important-change detection.
- MCP resource registry with `resources/list` and `resources/read` compatible endpoints.
- Seeded Smith Lab demo vault.
- Tests for permissions, ranking, latest version selection, claim tracing, MCP resource authorization, and version comparison.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start Postgres with pgvector:

```bash
docker compose up -d
```

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run db:migrate
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then choose **Open Demo Vault**.

## Database

The Prisma schema defines users, teams, vaults, projects, documents, document versions, chunks, citations, retrieval logs, MCP resources, and document changes. The first migration enables `vector` and `pgcrypto`. Chunk embeddings use pgvector through raw SQL because Prisma vector support is still awkward for portable typed helpers.

## Using The Ask Page

Open the seeded project and go to `/ask`. Try:

- “Why did we use Welch’s t-test?”
- “Is the claim ‘ventral striatum clearly responded more to gambling ads’ supported?”
- “Give me the latest approved public-safe summary.”
- “Which documents are authoritative for this project?”

Choose a role view before asking. Public viewers only receive `PUBLIC` chunks. Analysts do not receive `PI_ONLY` chunks. Answers include citation cards with document title, version, type, authority, visibility, section/page metadata, excerpt, and source URI when available.

## MCP Resources

The MVP exposes resources through:

- `GET /api/mcp/resources?roleView=PI`
- `POST /api/mcp/resources/read`

Example resource URIs:

```text
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/document/{documentId}/latest
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/document/{documentId}/version/{versionId}
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/latest-authoritative-context
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/public-context
```

`resources/read` returns:

- `contents`
- `mimeType`
- `metadata.documentTitle`
- `metadata.version`
- `metadata.authorityStatus`
- `metadata.visibility`
- `metadata.sourceUri`
- timestamps

Scaffolded future MCP tools are listed in `src/lib/mcp/registry.ts`: `search_context`, `trace_claim`, `compare_versions`, and `get_authoritative_context`.

## Architecture

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: small shadcn-style UI primitives and product components.
- `src/lib/ingestion`: extraction, chunking, and document ingestion.
- `src/lib/embeddings`: OpenAI embeddings and deterministic fallback.
- `src/lib/retrieval`: permission-aware retrieval, ranking, conflict detection, claim tracing, and citation-backed answers.
- `src/lib/versions`: text diff and important-change detection.
- `src/lib/mcp`: resource URI helpers, listing, reading, and future tool scaffolds.
- `prisma`: schema, migration, and seed data.
- `tests`: focused unit tests for product rules.

## Known Limitations

- Auth is a mock local PI session. TODO: add Auth.js/NextAuth, SSO, team invitations, and production RBAC.
- Local file storage is under `/storage`; production should use encrypted object storage.
- PDF page-aware extraction is basic; page numbers are nullable.
- Official MCP TypeScript SDK transport is not wired yet; the registry is isolated so it can be swapped in.
- OpenAI calls are optional; without `OPENAI_API_KEY`, embeddings and answers use deterministic local fallbacks for demoability.
- Connector permission models are TODOs for Google Drive, GitHub, Slack, and email.

## Future Roadmap

- Google Drive connector.
- GitHub connector.
- Slack/email ingestion.
- OAuth and production RBAC.
- SSO for teams.
- Stronger audit logs.
- Automatic stale-context detection.
- Contradiction detection across versions.
- Public/private export modes.
- Official MCP SDK integration if not already used.
- Hosted remote MCP server.
- Integration with agent testing tools like HarnessAmp.
