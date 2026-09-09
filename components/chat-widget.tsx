"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupportTicket } from "@/app/actions/support";

type Turn = { role: "user" | "assistant"; content: string };

const HISTORY_KEY = "drwash-chat-history";
const QUICK_REPLIES = [
  "How do I promote my shop?",
  "How does the referral program work?",
  "Talk to support",
  "Where's the privacy policy?",
];

function loadHistory(): Turn[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Turn[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(turns: Turn[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(turns));
  } catch {
    // sessionStorage can throw in private browsing — chat still works, just isn't persisted.
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // sessionStorage only exists client-side — load after mount so the
  // server-rendered and first client-rendered pass stay identical (avoids a
  // hydration mismatch), same reasoning as CallButton's device check.
  useEffect(() => {
    setTurns(loadHistory());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, isSending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const nextTurns: Turn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(nextTurns);
    saveHistory(nextTurns);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: turns.slice(-10) }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? "Something went wrong");
        return;
      }

      const withReply: Turn[] = [...nextTurns, { role: "assistant", content: data.reply }];
      setTurns(withReply);
      saveHistory(withReply);
    } catch {
      toast.error("Couldn't reach the assistant — check your connection.");
    } finally {
      setIsSending(false);
    }
  }

  async function escalate() {
    if (turns.length === 0) {
      toast.info("Send a message first so we have something to share with support.");
      return;
    }
    setIsEscalating(true);
    try {
      const transcript = turns.map((t) => `${t.role === "user" ? "You" : "Assistant"}: ${t.content}`).join("\n\n");
      const result = await createSupportTicket({
        subject: "Chat escalation",
        message: `Escalated from the AI chat assistant:\n\n${transcript}`,
      });
      if (result?.error) {
        toast.error(Object.values(result.error).flat()[0] ?? "Couldn't create a ticket");
        return;
      }
      toast.success("Support ticket created — we'll follow up by email.");
    } catch {
      toast.error("Sign in first so we know who to follow up with.");
    } finally {
      setIsEscalating(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(32rem,70vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <div>
                <p className="text-sm font-semibold leading-tight">Dr. Wash Assistant</p>
                <p className="text-[11px] leading-tight text-white/80">Usually replies instantly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/15"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {turns.length === 0 && (
              <div className="flex flex-col gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                  Hi! I&apos;m the Dr. Wash assistant. Ask me about posting a shop, promotion pricing,
                  referrals, or how to reach support.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, i) => (
              <div
                key={i}
                className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    turn.role === "user"
                      ? "rounded-br-sm bg-blue-600 text-white"
                      : "rounded-bl-sm bg-muted"
                  )}
                >
                  {turn.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t px-2 py-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              title="Escalate to human support"
              onClick={escalate}
              disabled={isEscalating}
            >
              {isEscalating ? <Loader2 className="size-4 animate-spin" /> : <LifeBuoy className="size-4" />}
            </Button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask a question…"
              className="h-8 flex-1 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              type="button"
              size="icon-sm"
              onClick={() => sendMessage(input)}
              disabled={isSending || !input.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
