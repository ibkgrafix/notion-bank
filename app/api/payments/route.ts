import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { billPaymentSchema } from "@/lib/validations";
import { validateAmount, generateReference } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const billers = await prisma.biller.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ billers });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const body = await request.json();
    const parsed = billPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { billerId, sourceAccountId, amount, description } = parsed.data;

    const amountResult = validateAmount(amount);
    if (!amountResult.valid) {
      return NextResponse.json({ error: amountResult.error }, { status: 400 });
    }
    const amountCents = amountResult.cents!;

    const [account, biller] = await Promise.all([
      prisma.account.findFirst({ where: { id: sourceAccountId, userId, status: "ACTIVE" } }),
      prisma.biller.findFirst({ where: { id: billerId, userId } }),
    ]);

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!biller) return NextResponse.json({ error: "Biller not found" }, { status: 404 });

    if (account.availableCents < amountCents) {
      return NextResponse.json({ error: "Insufficient available balance." }, { status: 400 });
    }

    const reference = generateReference();

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: sourceAccountId },
        data: { availableCents: { decrement: amountCents } },
      });

      return tx.transaction.create({
        data: {
          reference,
          accountId: sourceAccountId,
          type: "PAYMENT",
          amountCents,
          description: description || `Bill payment to ${biller.name}`,
          status: "PENDING",
          initiatedBy: userId,
          metadata: { billerName: biller.name, billerRef: biller.accountRef },
        },
      });
    });

    await createNotification({
      userId,
      type: "TRANSACTION",
      title: "Bill Payment Submitted",
      message: `Your payment of $${(amountCents / 100).toFixed(2)} to ${biller.name} (ref: ${reference}) is pending review.`,
      metadata: { reference, amountCents },
    });

    return NextResponse.json(
      { message: "Payment submitted for review.", transaction: { id: transaction.id, reference, status: "PENDING" } },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed. Please try again." }, { status: 500 });
  }
}
