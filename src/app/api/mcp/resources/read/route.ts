import { NextResponse } from "next/server";
import { z } from "zod";
import { readMcpResource } from "@/lib/mcp/registry";

const schema = z.object({ uri: z.string(), roleView: z.enum(["PI", "ANALYST", "COLLABORATOR", "PUBLIC_VIEWER"]).default("PI") });

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    return NextResponse.json(await readMcpResource(body.uri, body.roleView));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read resource" }, { status: 403 });
  }
}
