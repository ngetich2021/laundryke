export type UnreadTicketLike = {
  userLastReadAt: Date | null;
  adminLastReadAt: Date | null;
  messages: { authorRole: "USER" | "ADMIN" | "AI"; createdAt: Date }[];
};

const EPOCH = new Date(0);

/** True when the ticket owner has an admin reply they haven't opened yet. */
export function hasUnreadForUser(ticket: UnreadTicketLike): boolean {
  const since = ticket.userLastReadAt ?? EPOCH;
  return ticket.messages.some((m) => m.authorRole === "ADMIN" && m.createdAt > since);
}

/** True when support staff have a user message they haven't opened yet. */
export function hasUnreadForAdmin(ticket: UnreadTicketLike): boolean {
  const since = ticket.adminLastReadAt ?? EPOCH;
  return ticket.messages.some((m) => m.authorRole === "USER" && m.createdAt > since);
}

export function countUnread<T extends UnreadTicketLike>(
  tickets: T[],
  forRole: "USER" | "ADMIN"
): number {
  const check = forRole === "USER" ? hasUnreadForUser : hasUnreadForAdmin;
  return tickets.filter(check).length;
}
