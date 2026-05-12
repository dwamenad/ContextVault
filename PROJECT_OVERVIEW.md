# ContextVault MCP Project Overview

## Summary

ContextVault MCP is a governed knowledge vault for research labs and small technical teams. It turns project documents, notes, code, PDFs, analysis plans, and public summaries into a permission-aware, citation-grade context layer for AI agents.

The product is designed around an important principle: AI agents should only answer from trusted, visible, cited project context. If the context is insufficient, the system should say so instead of inventing an answer.

## Core Positioning

**An MCP-native knowledge vault for teams that cannot afford hallucinated context.**

ContextVault is not a generic “chat with docs” app. It emphasizes:

- Source provenance
- Document versions
- Authority labels
- Role-based visibility
- Citation-backed retrieval
- Stable MCP resource URIs

## Target Use Case

The MVP is built around a neuroscience lab project called **AdView Gambling Ads**.

The demo lab has messy but realistic project context:

- Preregistration
- Analysis Plan v1
- Analysis Plan v2
- FSL Model README
- ROI extraction script
- Lab meeting notes
- Public-facing summary

Users can ask questions like:

- Why did we use Welch’s t-test?
- Is the claim “ventral striatum clearly responded more to gambling ads” supported?
- What changed between analysis plan v1 and v2?
- Give me the latest approved public-safe summary.
- Which documents are authoritative for this project?

## MVP Features

- Team vault and project dashboard
- Project document library
- Manual text and file ingestion flow
- Document metadata, versions, chunks, and embeddings
- Authority labels: `AUTHORITATIVE`, `SUPPORTING`, `DRAFT`, `DEPRECATED`, `SCRATCH`
- Visibility labels: `PI_ONLY`, `ANALYST`, `COLLABORATOR`, `PUBLIC`
- Role-aware Ask page
- Citation cards with source title, version, type, authority, visibility, and excerpt
- Claim trace behavior for support checks
- Version comparison with important-change detection
- MCP resource listing and read endpoints
- No-database fallback demo mode for local preview

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Prisma
- PostgreSQL
- pgvector
- OpenAI embeddings and chat completions through isolated provider modules
- Vitest
- Docker Compose for local pgvector Postgres

## Architecture

```text
src/app
  Dashboard, vault, project, documents, ask, versions, MCP pages

src/app/api
  Upload, manual document ingestion, ask, version compare, MCP resources

src/lib/ingestion
  Text extraction, chunking, document/version creation

src/lib/retrieval
  Role filtering, authority ranking, retrieval, answer generation, claim tracing

src/lib/mcp
  Resource URI helpers, resource registry, resource read/list logic

src/lib/demo
  Bundled no-database demo context for local preview

prisma
  Schema, migration, and seed data
```

## MCP Resource Model

ContextVault exposes selected documents through stable URIs:

```text
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/document/{documentId}/latest
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/document/{documentId}/version/{versionId}
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/latest-authoritative-context
contextvault://team/{teamId}/vault/{vaultId}/project/{projectId}/public-context
```

Implemented API endpoints:

- `GET /api/mcp/resources`
- `POST /api/mcp/resources/read`

Future MCP tools are scaffolded:

- `search_context`
- `trace_claim`
- `compare_versions`
- `get_authoritative_context`

## Local Demo

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

If Postgres with pgvector is not running, the app automatically uses bundled demo data. This lets the dashboard, project pages, Ask page, version comparison, and MCP resource pages remain explorable.

## Full Database Setup

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

The database-backed mode enables real ingestion, persistent document versions, embeddings, retrieval logs, and MCP resource persistence.

## Current Limitations

- Authentication is a local mock session.
- No production RBAC, SSO, or OAuth yet.
- Local file storage is used for uploads.
- Official MCP SDK transport is not wired yet.
- PDF page-aware extraction is basic.
- No-database mode is a preview fallback, not persistent storage.

## Roadmap

- Google Drive connector
- GitHub connector
- Slack and email ingestion
- OAuth and production RBAC
- Team SSO
- Stronger audit logs
- Stale-context detection
- Contradiction detection across document versions
- Public/private export modes
- Official MCP SDK integration
- Hosted remote MCP server
- Agent evaluation integrations such as HarnessAmp
