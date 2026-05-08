CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'PI', 'ANALYST', 'COLLABORATOR', 'PUBLIC_VIEWER');
CREATE TYPE "DocumentType" AS ENUM ('PREREGISTRATION', 'ANALYSIS_PLAN', 'SCRIPT', 'README', 'MEETING_NOTE', 'PAPER_DRAFT', 'FIGURE_NOTE', 'PUBLIC_SUMMARY', 'DATA_DICTIONARY', 'OTHER');
CREATE TYPE "SourceType" AS ENUM ('UPLOAD', 'GOOGLE_DRIVE', 'GITHUB', 'LOCAL_FOLDER', 'MANUAL_TEXT');
CREATE TYPE "Visibility" AS ENUM ('PI_ONLY', 'ANALYST', 'COLLABORATOR', 'PUBLIC');
CREATE TYPE "AuthorityStatus" AS ENUM ('AUTHORITATIVE', 'SUPPORTING', 'DRAFT', 'DEPRECATED', 'SCRATCH');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "TeamRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vault" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "vaultId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "sourceType" "SourceType" NOT NULL,
  "sourceUri" TEXT,
  "visibility" "Visibility" NOT NULL,
  "authorityStatus" "AuthorityStatus" NOT NULL,
  "isMcpExposed" BOOLEAN NOT NULL DEFAULT false,
  "mcpUri" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentVersion" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "fileName" TEXT,
  "fileMimeType" TEXT,
  "fileSize" INTEGER,
  "storagePath" TEXT,
  "rawText" TEXT NOT NULL,
  "textHash" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chunk" (
  "id" TEXT NOT NULL,
  "documentVersionId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(1536),
  "chunkIndex" INTEGER NOT NULL,
  "pageNumber" INTEGER,
  "sectionTitle" TEXT,
  "startChar" INTEGER,
  "endChar" INTEGER,
  "tokenCount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Citation" (
  "id" TEXT NOT NULL,
  "chunkId" TEXT NOT NULL,
  "documentVersionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "pageNumber" INTEGER,
  "sectionTitle" TEXT,
  "sourceUri" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetrievalLog" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT,
  "query" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "retrievedChunkIds" JSONB NOT NULL,
  "citedChunkIds" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetrievalLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpResource" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "documentId" TEXT,
  "documentVersionId" TEXT,
  "uri" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "visibility" "Visibility" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentChange" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "fromVersionId" TEXT NOT NULL,
  "toVersionId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "diffText" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentChange_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE UNIQUE INDEX "Project_vaultId_slug_key" ON "Project"("vaultId", "slug");
CREATE UNIQUE INDEX "McpResource_uri_key" ON "McpResource"("uri");
CREATE UNIQUE INDEX "DocumentChange_documentId_fromVersionId_toVersionId_key" ON "DocumentChange"("documentId", "fromVersionId", "toVersionId");

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vault" ADD CONSTRAINT "Vault_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetrievalLog" ADD CONSTRAINT "RetrievalLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RetrievalLog" ADD CONSTRAINT "RetrievalLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "McpResource" ADD CONSTRAINT "McpResource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpResource" ADD CONSTRAINT "McpResource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "McpResource" ADD CONSTRAINT "McpResource_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChange" ADD CONSTRAINT "DocumentChange_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChange" ADD CONSTRAINT "DocumentChange_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChange" ADD CONSTRAINT "DocumentChange_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
