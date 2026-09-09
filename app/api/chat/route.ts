import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { askAssistant } from "@/lib/groq";
import { chatMessageSchema } from "@/lib/validations";
import { CHAT_RATE_LIMIT_MAX_MESSAGES, CHAT_RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

// Small in-memory token bucket, keyed by user id (or IP for anonymous
// visitors). Good enough to stop abuse of the Groq key on a single-instance
// deploy; resets on cold start, which is fine for this purpose.
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (t) => now - t < CHAT_RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= CHAT_RATE_LIMIT_MAX_MESSAGES) {
    requestLog.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const rateLimitKey =
    session?.user?.id ?? req.headers.get("x-forwarded-for") ?? "anonymous";
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: "You're sending messages too quickly — try again in a minute." },
      { status: 429 }
    );
  }

  const { message, history } = parsed.data;
  const userId = session?.user?.id ?? null;

  try {
    const reply = await askAssistant(history, message);

    await prisma.chatMessage
      .createMany({
        data: [
          { userId, role: "USER", content: message },
          { userId, role: "ASSISTANT", content: reply },
        ],
      })
      .catch(() => {
        // Logging is for admin monitoring only — never block the reply on it.
      });

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        error:
          "The assistant is having trouble right now — please try again, or open a support ticket.",
      },
      { status: 502 }
    );
  }
}
