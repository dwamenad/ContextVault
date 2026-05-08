import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const documents = await prisma.document.findMany({
    where: { projectId },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
    orderBy: [{ documentType: "asc" }, { title: "asc" }],
  });
  return NextResponse.json({ documents });
}
