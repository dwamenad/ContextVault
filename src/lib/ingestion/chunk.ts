export type TextChunk = {
  content: string;
  chunkIndex: number;
  sectionTitle?: string;
  startChar: number;
  endChar: number;
  tokenCount: number;
};

export function chunkText(rawText: string, title: string, targetWords = 850, overlapWords = 120): TextChunk[] {
  const text = rawText.trim();
  if (!text) return [];
  const headingMatches = [...text.matchAll(/^#{1,4}\s+(.+)$/gm)];
  const sectionFor = (index: number) => {
    const heading = headingMatches.filter((m) => (m.index ?? 0) <= index).at(-1);
    return heading?.[1]?.trim() || title;
  };
  const words = text.match(/\S+/g) ?? [];
  const chunks: TextChunk[] = [];
  let wordStart = 0;
  let cursor = 0;
  const positions = words.map((word) => {
    const start = text.indexOf(word, cursor);
    cursor = start + word.length;
    return { start, end: cursor };
  });
  while (wordStart < words.length) {
    const wordEnd = Math.min(words.length, wordStart + targetWords);
    const startChar = positions[wordStart]?.start ?? 0;
    const endChar = positions[wordEnd - 1]?.end ?? text.length;
    chunks.push({
      content: text.slice(startChar, endChar),
      chunkIndex: chunks.length,
      sectionTitle: sectionFor(startChar),
      startChar,
      endChar,
      tokenCount: Math.round((wordEnd - wordStart) * 1.3),
    });
    if (wordEnd === words.length) break;
    wordStart = Math.max(wordEnd - overlapWords, wordStart + 1);
  }
  return chunks;
}
