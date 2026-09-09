import "server-only";
import { GROQ_MODEL } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/ai-knowledge";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function askAssistant(history: ChatTurn[], message: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 600,
      // gpt-oss is a reasoning model — keep its internal reasoning short so
      // token budget goes to the actual reply, and replies stay snappy for
      // a support-chat widget.
      reasoning_effort: "low",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...history,
        { role: "user", content: message },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq request failed: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Groq returned an empty response");
  return reply;
}

// Cheap liveness/auth check for the health report — lists models rather
// than spending tokens on a completion.
export async function pingGroq(): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch(`${GROQ_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Groq ping failed: ${res.status}`);
}
