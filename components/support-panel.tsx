"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Send, Star, LifeBuoy, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  supportTicketSchema,
  supportMessageSchema,
  feedbackSchema,
  type SupportTicketInput,
  type SupportMessageInput,
  type FeedbackInput,
} from "@/lib/validations";
import { createSupportTicket, replyToTicket, getMyTickets } from "@/app/actions/support";
import { submitFeedback, getMyFeedback } from "@/app/actions/feedback";
import { cn } from "@/lib/utils";
import type { SupportTicket, SupportMessage, Feedback } from "@/lib/generated/prisma/client";

type TicketWithMessages = SupportTicket & { messages: SupportMessage[] };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
  CLOSED: "outline",
};

function NewTicketDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { subject: "", message: "" },
  });

  async function onSubmit(data: SupportTicketInput) {
    const result = await createSupportTicket(data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }
    toast.success("Ticket created — we'll reply by email too");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New ticket
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a support ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subject">Subject</FieldLabel>
              <Input id="subject" placeholder="e.g. Payment didn't go through" {...register("subject")} />
              <FieldError errors={[errors.subject]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="message">Message</FieldLabel>
              <Textarea id="message" rows={5} placeholder="Tell us what's going on…" {...register("message")} />
              <FieldError errors={[errors.message]} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketThread({ ticket, onReplied }: { ticket: TicketWithMessages; onReplied: () => void }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportMessageInput>({
    resolver: zodResolver(supportMessageSchema),
    defaultValues: { body: "" },
  });

  function onSubmit(data: SupportMessageInput) {
    startTransition(async () => {
      const result = await replyToTicket(ticket.id, data);
      if (result?.error) {
        const firstError = Object.values(result.error).flat()[0];
        toast.error(firstError ?? "Something went wrong");
        return;
      }
      reset();
      onReplied();
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3">
      {ticket.messages.map((m) => (
        <div
          key={m.id}
          className={cn("flex", m.authorRole === "USER" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
              m.authorRole === "USER" ? "bg-blue-600 text-white" : "bg-muted"
            )}
          >
            {m.authorRole === "ADMIN" && (
              <p className="mb-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                Dr. Wash Support
              </p>
            )}
            {m.body}
          </div>
        </div>
      ))}

      {ticket.status !== "CLOSED" && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Input placeholder="Reply…" {...register("body")} />
            <Button type="submit" size="icon-sm" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <FieldError errors={[errors.body]} />
        </form>
      )}
    </div>
  );
}

function TicketsTab({ tickets, refresh }: { tickets: TicketWithMessages[]; refresh: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Need help with something account-specific? Open a ticket and a real person will follow
          up by email.
        </p>
        <NewTicketDialog onCreated={refresh} />
      </div>

      {tickets.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">You haven&apos;t opened any tickets yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              >
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-sm">{ticket.subject}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(ticket.updatedAt).toLocaleString()} · {ticket.messages.length} message
                      {ticket.messages.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>{ticket.status}</Badge>
                </CardHeader>
              </button>
              {expandedId === ticket.id && <TicketThread ticket={ticket} onReplied={refresh} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function FeedbackTab({ history, refresh }: { history: Feedback[]; refresh: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 5, category: "OTHER" as const, message: "" },
  });

  const rating = watch("rating") as number;
  const category = watch("category");

  async function onSubmit(data: FeedbackInput) {
    const result = await submitFeedback(data);
    if (result?.error) {
      const firstError = Object.values(result.error).flat()[0];
      toast.error(firstError ?? "Something went wrong");
      return;
    }
    toast.success("Thanks for the feedback!");
    reset({ rating: 5, category: "OTHER", message: "" });
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel>Rating</FieldLabel>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue("rating", n)}
                  aria-label={`${n} star`}
                >
                  <Star
                    className={cn(
                      "size-6",
                      n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{RATING_LABELS[rating]}</span>
            </div>
            <input type="hidden" {...register("rating", { valueAsNumber: true })} />
          </Field>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select
              items={{ BUG: "Bug", SUGGESTION: "Suggestion", COMPLIMENT: "Compliment", OTHER: "Other" }}
              value={category}
              onValueChange={(value) => setValue("category", value as FeedbackInput["category"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUG">Bug</SelectItem>
                <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                <SelectItem value="COMPLIMENT">Compliment</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="feedback-message">Your feedback</FieldLabel>
            <Textarea id="feedback-message" rows={4} placeholder="What's on your mind?" {...register("message")} />
            <FieldError errors={[errors.message]} />
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Submit feedback
          </Button>
        </FieldGroup>
      </form>

      {history.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Your past feedback</p>
          {history.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "size-3.5",
                          n <= f.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <Badge variant="outline">{f.category}</Badge>
                </div>
                <p className="text-sm">{f.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupportPanel({
  initialTickets,
  initialFeedback,
}: {
  initialTickets: TicketWithMessages[];
  initialFeedback: Feedback[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [, startTransition] = useTransition();

  function refreshTickets() {
    startTransition(async () => {
      setTickets(await getMyTickets());
    });
  }

  function refreshFeedback() {
    startTransition(async () => {
      setFeedback(await getMyFeedback());
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Tabs defaultValue="tickets">
        <TabsList variant="line">
          <TabsTrigger value="tickets" className="gap-1.5">
            <LifeBuoy className="size-4" />
            My tickets
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquareText className="size-4" />
            Feedback
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="mt-4">
          <TicketsTab tickets={tickets} refresh={refreshTickets} />
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          <FeedbackTab history={feedback} refresh={refreshFeedback} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
