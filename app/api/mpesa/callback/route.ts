import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAdvertiseReceipt } from "@/lib/mailer";

type StkCallbackItem = { Name: string; Value: string | number };

// Safaricom Daraja hits this after an STK push resolves (success or cancel).
// Always return 200 with ResultCode 0 so Safaricom doesn't retry — failures
// are recorded on our side regardless of what we send back.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const callback = body?.Body?.stkCallback;

  if (!callback?.CheckoutRequestID) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: CheckoutRequestID },
  });

  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (ResultCode === 0) {
    const items: StkCallbackItem[] = callback.CallbackMetadata?.Item ?? [];
    const get = (name: string) => items.find((i) => i.Name === name)?.Value;
    const mpesaReceipt = String(get("MpesaReceiptNumber") ?? "");

    const [, updatedListing, user] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", mpesaReceipt, resultDesc: ResultDesc },
      }),
      prisma.listing.update({
        where: { id: payment.listingId },
        data: {
          promotedUntil: new Date(
            Date.now() + payment.days * 24 * 60 * 60 * 1000
          ),
          ...(payment.includesVideo && {
            videoPromotedUntil: new Date(
              Date.now() + payment.days * 24 * 60 * 60 * 1000
            ),
          }),
        },
      }),
      prisma.user.findUniqueOrThrow({ where: { id: payment.userId } }),
    ]);

    sendAdvertiseReceipt({
      to: user.email,
      businessName: updatedListing.businessName,
      amount: payment.amount,
      days: payment.days,
      mpesaReceipt,
    }).catch(() => {
      // Non-critical: the payment already succeeded and the listing is promoted.
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", resultDesc: ResultDesc },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
