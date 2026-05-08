import { NextResponse } from "next/server";
import { listMcpResources } from "@/lib/mcp/registry";
import type { RoleView } from "@/lib/permissions/visibility";

export async function GET(request: Request) {
  const role = (new URL(request.url).searchParams.get("roleView") || "PI") as RoleView;
  return NextResponse.json({ resources: await listMcpResources(role) });
}
