import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getMockSession } from "@/lib/auth/session";
import { extractTextFromFile } from "@/lib/ingestion/extract";
import { ingestDocument } from "@/lib/ingestion/ingest";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  const projectId = String(form.get("projectId"));
  const title = String(form.get("title") || file.name);
  const documentType = String(form.get("documentType") || "OTHER") as never;
  const visibility = String(form.get("visibility") || "ANALYST") as never;
  const authorityStatus = String(form.get("authorityStatus") || "DRAFT") as never;
  const isMcpExposed = String(form.get("isMcpExposed")) === "true";
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageDir = path.join(process.cwd(), "storage", projectId);
  await mkdir(storageDir, { recursive: true });
  const storagePath = path.join(storageDir, `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  await writeFile(storagePath, buffer);
  const rawText = await extractTextFromFile(file.name, file.type, buffer);
  const session = await getMockSession();
  const document = await ingestDocument({
    projectId,
    title,
    rawText,
    documentType,
    sourceType: "UPLOAD",
    sourceUri: storagePath,
    visibility,
    authorityStatus,
    isMcpExposed,
    fileName: file.name,
    fileMimeType: file.type,
    fileSize: file.size,
    storagePath,
    createdById: session.userId,
  });
  return NextResponse.json({ document });
}
