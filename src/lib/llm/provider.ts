import OpenAI from "openai";

export async function completeGroundedAnswer(prompt: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await client.chat.completions.create({
    model: process.env.CHAT_MODEL ?? "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You answer only from supplied ContextVault excerpts. Cite claims with bracketed citation ids like [C1]. Say evidence is insufficient when needed.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });
  return result.choices[0]?.message.content ?? null;
}
