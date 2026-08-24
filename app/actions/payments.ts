"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { advertiseSchema, normalizeKenyanPhone } from "@/lib/validations";
import { advertiseAmount } from "@/lib/constants";
import { initiateStkPush } from "@/lib/mpesa";

export async function initiateAdvertisePayment(input: unknown) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = advertiseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { listingId, phone, days } = parsed.data;

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, ownerId: session.user.id },
  });
  if (!listing) {
    return { error: { listingId: ["Listing not found"] } };
  }

  const amount = advertiseAmount(days);
  const normalizedPhone = normalizeKenyanPhone(phone);

  try {
    const stk = await initiateStkPush({
      phone: normalizedPhone,
      amount,
      accountReference: listing.businessName.slice(0, 12) || "DrWash",
      transactionDesc: `Promote ${listing.businessName}`,
    });

    const payment = await prisma.payment.create({
      data: {
        listingId,
        userId: session.user.id,
        amount,
        phone: normalizedPhone,
        days,
        merchantRequestId: stk.MerchantRequestID,
        checkoutRequestId: stk.CheckoutRequestID,
      },
    });

    return {
      success: true as const,
      paymentId: payment.id,
      message: stk.CustomerMessage,
    };
  } catch (err) {
    return {
      error: {
        root: [err instanceof Error ? err.message : "Payment failed to start"],
      },
    };
  }
}

export async function getMyPayments() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.payment.findMany({
    where: { userId: session.user.id },
    include: { listing: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getPaymentStatus(paymentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: session.user.id },
    select: { status: true, resultDesc: true },
  });
  return payment ?? null;
}
