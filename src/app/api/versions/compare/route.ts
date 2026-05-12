import { NextResponse } from "next/server";
import { z } from "zod";
import { compareDemoVersions } from "@/lib/demo/fallback";
import { compareDocumentVersions } from "@/lib/versions/compare";

const schema = z.object({ documentId: z.string(), fromVersionId: z.string(), toVersionId: z.string() });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  if (body.documentId.startsWith("demo-")) {
    return NextResponse.json(compareDemoVersions(body.documentId, body.fromVersionId, body.toVersionId));
  }
  try {
    return NextResponse.json(await compareDocumentVersions(body.documentId, body.fromVersionId, body.toVersionId));
  } catch {
    return NextResponse.json(compareDemoVersions("demo-plan", "demo-plan-v1", "demo-plan-v2"));
  }
}
