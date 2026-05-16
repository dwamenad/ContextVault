import { NextResponse } from "next/server";
import { checkDatabaseReadiness } from "@/lib/system/database-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await checkDatabaseReadiness();
  return NextResponse.json(readiness, { status: readiness.ok ? 200 : 503 });
}
