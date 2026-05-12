import { NextResponse } from "next/server";
import { z } from "zod";
import { getMockSession } from "@/lib/auth/session";
import { askDemoProject, isDemoProjectId } from "@/lib/demo/fallback";
import { askProject } from "@/lib/retrieval/engine";

const schema = z.object({
  projectId: z.string(),
  query: z.string().min(2),
  roleView: z.enum(["PI", "ANALYST", "COLLABORATOR", "PUBLIC_VIEWER"]).default("PI"),
  retrievalMode: z.enum(["LATEST_AUTHORITATIVE_ONLY", "INCLUDE_SUPPORTING", "INCLUDE_DRAFTS", "PUBLIC_SAFE_ONLY"]).default("INCLUDE_SUPPORTING"),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  if (isDemoProjectId(body.projectId)) {
    return NextResponse.json(askDemoProject(body));
  }
  try {
    const session = await getMockSession();
    const result = await askProject({ ...body, userId: session.userId });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(askDemoProject(body));
  }
}
