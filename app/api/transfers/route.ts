import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transferSchema } from "@/lib/validations";
import { validateAmount, generateReference } from "@/lib/utils";
import { notifyTransferInitiated } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const body = await request.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { sourceAccountId, beneficiaryId, amount, description } = parsed.data;

    const amountResult = validateAmount(amount);
    if (!amountResult.valid) {
      return NextResponse.json(
        { error: amountResult.error },
        { status: 400 }
      );
    }

    const amountCents = amountResult.cents!;

    // Verify source account belongs to user and is active
    const sourceAccount = await prisma.account.findFirst({
      where: { id: sourceAccountId, userId },
    });

    if (!sourceAccount) {
      return NextResponse.json(
        { error: "Source account not found." },
        { status: 404 }
      );
    }

    if (sourceAccount.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Source account is not active." },
        { status: 400 }
      );
    }

    if (sourceAccount.availableCents < amountCents) {
      return NextResponse.json(
        { error: "Insufficient available balance." },
        { status: 400 }
      );
    }

    // Verify beneficiary belongs to user
    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, userId, status: "ACTIVE" },
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: "Beneficiary not found." },
        { status: 404 }
      );
    }

    const reference = generateReference();

    // Create transaction and hold funds
    const transaction = await prisma.$transaction(async (tx) => {
      // Hold available balance
      await tx.account.update({
        where: { id: sourceAccountId },
        data: { availableCents: { decrement: amountCents } },
      });

      const newTransaction = await tx.transaction.create({
        data: {
          reference,
          accountId: sourceAccountId,
          beneficiaryId,
          type: "TRANSFER",
          amountCents,
          description: description || `Transfer to ${beneficiary.name}`,
          status: "PENDING",
          initiatedBy: userId,
        },
      });

      return newTransaction;
    });

    await notifyTransferInitiated(userId, amountCents, reference);

    // Log transfer initiation server-side
    console.info(`[TRANSFER] User ${userId} initiated transfer ${reference} for $${(amountCents / 100).toFixed(2)}`);

    return NextResponse.json(
      {
        message: "Transfer submitted successfully and is pending review.",
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          amountCents: transaction.amountCents,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Transfer error:", error);
    return NextResponse.json(
      { error: "Transfer failed. Please try again." },
      { status: 500 }
    );
  }
}
