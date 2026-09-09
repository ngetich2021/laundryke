"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-guards";
import { supportTicketSchema, supportMessageSchema } from "@/lib/validations";
import { sendSupportReply } from "@/lib/mailer";
import type { TicketStatus } from "@/lib/generated/prisma/client";

export async function createSupportTicket(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      messages: {
        create: {
          authorId: session.user.id,
          authorRole: "USER",
          body: parsed.data.message,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true as const, ticketId: ticket.id };
}

export async function replyToTicket(ticketId: string, input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = supportMessageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId: session.user.id },
  });
  if (!ticket) throw new Error("Not found");

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: { ticketId, authorId: session.user.id, authorRole: "USER", body: parsed.data.body },
    }),
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: ticket.status === "CLOSED" ? "OPEN" : ticket.status },
    }),
  ]);

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function getMyTickets() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAllTicketsForAdmin() {
  await requirePermission("MANAGE_SUPPORT");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          listings: {
            select: { id: true, businessName: true, isActive: true, promotedUntil: true },
          },
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets;
}

export async function adminReplyToTicket(ticketId: string, input: unknown) {
  const session = await requirePermission("MANAGE_SUPPORT");

  const parsed = supportMessageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { email: true } } },
  });
  if (!ticket) throw new Error("Not found");

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId,
        authorId: session.user.id,
        authorRole: "ADMIN",
        body: parsed.data.body,
      },
    }),
    prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } }),
  ]);

  sendSupportReply({
    to: ticket.user.email,
    subject: ticket.subject,
    body: parsed.data.body,
  }).catch(() => {
    // Non-critical: the reply is already saved in the thread either way.
  });

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function setTicketStatus(ticketId: string, status: TicketStatus) {
  await requirePermission("MANAGE_SUPPORT");
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  revalidatePath("/dashboard");
}

export async function getAllChatMessagesForAdmin() {
  await requirePermission("MANAGE_SUPPORT");
  return prisma.chatMessage.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
