import { NextResponse } from "next/server";
import { z } from "zod";
import { compareDocumentVersions } from "@/lib/versions/compare";

const schema = z.object({ documentId: z.string(), fromVersionId: z.string(), toVersionId: z.string() });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  return NextResponse.json(await compareDocumentVersions(body.documentId, body.fromVersionId, body.toVersionId));
}
