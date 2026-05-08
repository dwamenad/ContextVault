import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  return NextResponse.json({ vaults: await prisma.vault.findMany({ include: { projects: true } }) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const vault = await prisma.vault.create({ data: { teamId: body.teamId, name: body.name, description: body.description } });
  return NextResponse.json({ vault });
}
