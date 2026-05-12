import { NextResponse } from "next/server";
import { z } from "zod";
import { readDemoMcpResource } from "@/lib/demo/fallback";
import { readMcpResource } from "@/lib/mcp/registry";

const schema = z.object({ uri: z.string(), roleView: z.enum(["PI", "ANALYST", "COLLABORATOR", "PUBLIC_VIEWER"]).default("PI") });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  try {
    if (body.uri.includes("/demo-")) {
      return NextResponse.json(readDemoMcpResource(body.uri, body.roleView));
    }
    return NextResponse.json(await readMcpResource(body.uri, body.roleView));
  } catch (error) {
    try {
      return NextResponse.json(readDemoMcpResource(body.uri, body.roleView));
    } catch {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read resource" }, { status: 403 });
    }
  }
}
