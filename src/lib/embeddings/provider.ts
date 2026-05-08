import OpenAI from "openai";

export type EmbeddingProvider = {
  embed(text: string): Promise<number[]>;
};

function deterministicEmbedding(text: string, dimensions = 1536) {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const word of words) {
    let hash = 2166136261;
    for (let i = 0; i < word.length; i++) hash = Math.imul(hash ^ word.charCodeAt(i), 16777619);
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const norm = Math.hypot(...vector) || 1;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i++) dot += a[i] * b[i];
  return dot;
}

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!process.env.OPENAI_API_KEY) {
    return { embed: async (text) => deterministicEmbedding(text) };
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return {
    async embed(text) {
      const result = await client.embeddings.create({
        model: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
        input: text.slice(0, 24000),
      });
      return result.data[0]?.embedding ?? deterministicEmbedding(text);
    },
  };
}

export function toSqlVector(vector: number[]) {
  return `[${vector.map((v) => Number(v.toFixed(8))).join(",")}]`;
}
