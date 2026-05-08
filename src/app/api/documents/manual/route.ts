import { NextResponse } from "next/server";
import { z } from "zod";
import { getMockSession } from "@/lib/auth/session";
import { ingestDocument } from "@/lib/ingestion/ingest";

const schema = z.object({
  projectId: z.string(),
  title: z.string().min(2),
  rawText: z.string().min(1),
  documentType: z.enum(["PREREGISTRATION", "ANALYSIS_PLAN", "SCRIPT", "README", "MEETING_NOTE", "PAPER_DRAFT", "FIGURE_NOTE", "PUBLIC_SUMMARY", "DATA_DICTIONARY", "OTHER"]),
  visibility: z.enum(["PI_ONLY", "ANALYST", "COLLABORATOR", "PUBLIC"]),
  authorityStatus: z.enum(["AUTHORITATIVE", "SUPPORTING", "DRAFT", "DEPRECATED", "SCRATCH"]),
  isMcpExposed: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await getMockSession();
  const document = await ingestDocument({ ...body, sourceType: "MANUAL_TEXT", createdById: session.userId });
  return NextResponse.json({ document });
}
