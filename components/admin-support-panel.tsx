"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, LifeBuoy, MessageSquareText, Bot, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountBadge } from "@/components/ui/count-badge";
import { DetailDialog, type DetailField } from "@/components/ui/detail-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, sortableHeader, type ColumnDef } from "@/components/ui/data-table";
import {
  adminReplyToTicket,
  setTicketStatus,
  markTicketReadByAdmin,
  type getAllTicketsForAdmin,
} from "@/app/actions/support";
import type { getAllFeedbackForAdmin } from "@/app/actions/feedback";
import type { TicketStatus } from "@/lib/generated/prisma/client";
import { hasUnreadForAdmin, countUnread } from "@/lib/support-unread";
import { cn } from "@/lib/utils";

type AdminTicket = Awaited<ReturnType<typeof getAllTicketsForAdmin>>[number];
type AdminFeedback = Awaited<ReturnType<typeof getAllFeedbackForAdmin>>[number];
export type AdminChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
  CLOSED: "outline",
};

function TicketDialog({ ticket, onClose }: { ticket: AdminTicket; onClose: () => void }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);

  useEffect(() => {
    if (hasUnreadForAdmin(ticket)) {
      markTicketReadByAdmin(ticket.id).then(() => router.refresh());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  function sendReply() {
    if (!reply.trim()) return;
    startTransition(async () => {
      const result = await adminReplyToTicket(ticket.id, { body: reply });
      if (result?.error) {
        toast.error(Object.values(result.error).flat()[0] ?? "Something went wrong");
        return;
      }
      toast.success("Reply sent");
      setReply("");
      onClose();
    });
  }

  function changeStatus(next: TicketStatus) {
    setStatus(next);
    setTicketStatus(ticket.id, next).then(() => toast.success("Status updated"));
  }

  const activeListings = ticket.user.listings.filter((l) => l.isActive).length;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Requester account
            </p>
            <div>
              <p className="font-medium">{ticket.user.name ?? "—"}</p>
              <p className="text-muted-foreground">{ticket.user.email}</p>
              <p className="text-muted-foreground">{ticket.user.phone ?? "No phone on file"}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(ticket.user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Shops ({activeListings} live)
              </p>
              {ticket.user.listings.length === 0 ? (
                <p className="text-muted-foreground">No shops</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1">
                  {ticket.user.listings.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{l.businessName}</span>
                      <Badge variant={l.isActive ? "default" : "outline"} className="shrink-0">
                        {l.isActive ? "Live" : "Draft"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Recent payments
              </p>
              {ticket.user.payments.length === 0 ? (
                <p className="text-muted-foreground">None yet</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1">
                  {ticket.user.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span>KES {p.amount}</span>
                      <Badge
                        variant={
                          p.status === "SUCCESS"
                            ? "default"
                            : p.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Status</p>
              <Select
                items={{ OPEN: "Open", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" }}
                value={status}
                onValueChange={(value) => changeStatus(value as TicketStatus)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
              {ticket.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.authorRole === "ADMIN" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                      m.authorRole === "ADMIN" ? "bg-blue-600 text-white" : "bg-muted"
                    )}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Reply as support…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
              />
              <Button size="icon-sm" onClick={sendReply} disabled={isPending || !reply.trim()}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The reply is also emailed to the requester.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminSupportPanel({
  tickets,
  feedback,
  chatMessages,
}: {
  tickets: AdminTicket[];
  feedback: AdminFeedback[];
  chatMessages: AdminChatMessage[];
}) {
  const [openTicket, setOpenTicket] = useState<AdminTicket | null>(null);
  const [detailFeedback, setDetailFeedback] = useState<AdminFeedback | null>(null);
  const [detailChat, setDetailChat] = useState<AdminChatMessage | null>(null);

  const ticketColumns: ColumnDef<AdminTicket, unknown>[] = [
    {
      accessorKey: "subject",
      header: sortableHeader<AdminTicket>("Subject"),
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          {row.original.subject}
          {hasUnreadForAdmin(row.original) && (
            <span className="inline-flex size-2 rounded-full bg-blue-600" />
          )}
        </span>
      ),
    },
    {
      id: "requester",
      header: sortableHeader<AdminTicket>("Requester"),
      accessorFn: (row) => row.user.name ?? row.user.email,
    },
    {
      accessorKey: "status",
      header: sortableHeader<AdminTicket>("Status"),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status] ?? "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "messages",
      header: "Messages",
      cell: ({ row }) => row.original.messages.length,
    },
    {
      accessorKey: "updatedAt",
      header: sortableHeader<AdminTicket>("Updated"),
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
    },
  ];

  const feedbackColumns: ColumnDef<AdminFeedback, unknown>[] = [
    {
      id: "user",
      header: sortableHeader<AdminFeedback>("User"),
      accessorFn: (row) => row.user.name ?? row.user.email,
    },
    {
      accessorKey: "rating",
      header: sortableHeader<AdminFeedback>("Rating"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
          {row.original.rating}
        </div>
      ),
    },
    { accessorKey: "category", header: sortableHeader<AdminFeedback>("Category") },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => <span className="line-clamp-2">{row.original.message}</span>,
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<AdminFeedback>("Date"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  const feedbackFields: DetailField[] = detailFeedback
    ? [
        { label: "User", value: detailFeedback.user.name ?? detailFeedback.user.email },
        { label: "Rating", value: `${detailFeedback.rating} / 5` },
        { label: "Category", value: detailFeedback.category },
        { label: "Message", value: detailFeedback.message },
        { label: "Date", value: new Date(detailFeedback.createdAt).toLocaleString() },
      ]
    : [];

  const chatFields: DetailField[] = detailChat
    ? [
        { label: "User", value: detailChat.user?.name ?? detailChat.user?.email ?? "Anonymous visitor" },
        { label: "Role", value: detailChat.role === "ASSISTANT" ? "Assistant" : "Visitor" },
        { label: "Message", value: detailChat.content },
        { label: "Date", value: new Date(detailChat.createdAt).toLocaleString() },
      ]
    : [];

  const chatColumns: ColumnDef<AdminChatMessage, unknown>[] = [
    {
      id: "user",
      header: sortableHeader<AdminChatMessage>("User"),
      accessorFn: (row) => row.user?.name ?? row.user?.email ?? "Anonymous visitor",
    },
    {
      accessorKey: "role",
      header: sortableHeader<AdminChatMessage>("Role"),
      cell: ({ row }) => (
        <Badge variant={row.original.role === "ASSISTANT" ? "secondary" : "outline"}>
          {row.original.role === "ASSISTANT" ? "Assistant" : "Visitor"}
        </Badge>
      ),
    },
    {
      accessorKey: "content",
      header: "Message",
      cell: ({ row }) => <span className="line-clamp-2">{row.original.content}</span>,
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader<AdminChatMessage>("Date"),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="tickets">
        <TabsList variant="line">
          <TabsTrigger value="tickets" className="gap-1.5">
            <LifeBuoy className="size-4" /> Tickets
            <CountBadge count={countUnread(tickets, "ADMIN")} />
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquareText className="size-4" /> Feedback
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <Bot className="size-4" /> Chat logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4">
          <DataTable
            columns={ticketColumns}
            data={tickets}
            csvFilename="support-tickets.csv"
            csvData={tickets.map((t) => ({
              subject: t.subject,
              requester: t.user.name ?? t.user.email,
              status: t.status,
              updatedAt: t.updatedAt.toISOString(),
            }))}
            emptyMessage="No support tickets yet."
            onRowClick={setOpenTicket}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <DataTable
            columns={feedbackColumns}
            data={feedback}
            csvFilename="feedback.csv"
            csvData={feedback.map((f) => ({
              user: f.user.name ?? f.user.email,
              rating: f.rating,
              category: f.category,
              message: f.message,
              createdAt: f.createdAt.toISOString(),
            }))}
            emptyMessage="No feedback submitted yet."
            onRowClick={setDetailFeedback}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <DataTable
            columns={chatColumns}
            data={chatMessages}
            csvFilename="chat-logs.csv"
            csvData={chatMessages.map((c) => ({
              user: c.user?.name ?? c.user?.email ?? "Anonymous",
              role: c.role,
              content: c.content,
              createdAt: c.createdAt.toISOString(),
            }))}
            emptyMessage="No chat activity yet."
            onRowClick={setDetailChat}
          />
        </TabsContent>
      </Tabs>

      {openTicket && <TicketDialog ticket={openTicket} onClose={() => setOpenTicket(null)} />}

      <DetailDialog
        open={!!detailFeedback}
        onOpenChange={(open) => !open && setDetailFeedback(null)}
        title="Feedback"
        fields={feedbackFields}
      />

      <DetailDialog
        open={!!detailChat}
        onOpenChange={(open) => !open && setDetailChat(null)}
        title="Chat message"
        fields={chatFields}
      />
    </div>
  );
}
