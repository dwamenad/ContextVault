import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  return NextResponse.json({ projects: await prisma.project.findMany({ include: { vault: true } }) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const project = await prisma.project.create({ data: { vaultId: body.vaultId, name: body.name, slug: body.slug, description: body.description } });
  return NextResponse.json({ project });
}
