import { NextResponse } from "next/server";
import { z } from "zod";
import { governanceChangeSummary, updateDocumentGovernance } from "@/lib/documents/governance";

const schema = z.object({
  visibility: z.enum(["PI_ONLY", "ANALYST", "COLLABORATOR", "PUBLIC"]),
  authorityStatus: z.enum(["AUTHORITATIVE", "SUPPORTING", "DRAFT", "DEPRECATED", "SCRATCH"]),
  isMcpExposed: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const body = schema.parse(await request.json());
  if (documentId.startsWith("demo-")) {
    return NextResponse.json({
      demoMode: true,
      document: { id: documentId, ...body },
      governance: governanceChangeSummary({ documentId, ...body }),
      message: "Demo mode previewed the governance update. Start Postgres with pgvector to persist it.",
    });
  }
  const document = await updateDocumentGovernance({ documentId, ...body });
  return NextResponse.json({ document, governance: governanceChangeSummary({ documentId, ...body }) });
}
