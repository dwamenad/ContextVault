import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(fileName: string, mimeType: string, buffer: Buffer) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const pdf = await parser.getText();
      return pdf.text;
    } finally {
      await parser.destroy();
    }
  }
  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (/\.(txt|md|csv|sh|py|r|js|ts|tsx|jsx|json|yml|yaml)$/i.test(lower) || mimeType.startsWith("text/")) {
    return buffer.toString("utf8");
  }
  return `Unsupported file type for text extraction: ${fileName}. Metadata was stored, but no searchable text could be extracted.`;
}
