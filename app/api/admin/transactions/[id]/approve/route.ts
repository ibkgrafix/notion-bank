import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { sendTransferStatusEmail } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const adminSession = requireAdmin(session);

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // Lock and verify transaction
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          account: { include: { user: true } },
        },
      });

      if (!transaction) {
        throw new Error("TRANSACTION_NOT_FOUND");
      }

      if (transaction.status !== "PENDING") {
        throw new Error("TRANSACTION_NOT_PENDING");
      }

      const account = transaction.account;

      if (account.status !== "ACTIVE") {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      // Re-verify sufficient balance at approval time
      if (account.balanceCents < transaction.amountCents) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Deduct from balance
      await tx.account.update({
        where: { id: account.id },
        data: {
          balanceCents: { decrement: transaction.amountCents },
          // Available was already decremented at initiation; restore then re-check
        },
      });

      // Mark transaction completed
      await tx.transaction.update({
        where: { id },
        data: {
          status: "COMPLETED",
          approvedBy: adminSession.userId,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create notification for customer
      await tx.notification.create({
        data: {
          userId: account.userId,
          type: "TRANSFER",
          title: "Transfer Approved",
          message: `Your transfer of $${(transaction.amountCents / 100).toFixed(2)} (ref: ${transaction.reference}) has been approved and completed.`,
          metadata: { reference: transaction.reference, amountCents: transaction.amountCents },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: adminSession.userId,
          action: "ADMIN_APPROVED_TRANSACTION",
          entityType: "Transaction",
          entityId: id,
          description: `Admin approved transaction ${transaction.reference} for $${(transaction.amountCents / 100).toFixed(2)} from ${account.user.email}`,
          metadata: {
            reference: transaction.reference,
            amountCents: transaction.amountCents,
            userId: account.userId,
          },
        },
      });
    });

    // Send approval email (non-blocking) — fetch user info outside the transaction
    const approvedTx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: { include: { user: { select: { email: true, firstName: true } } } },
        beneficiary: { select: { name: true } },
      },
    });
    if (approvedTx) {
      sendTransferStatusEmail({
        to: approvedTx.account.user.email,
        firstName: approvedTx.account.user.firstName,
        status: "approved",
        amount: approvedTx.amountCents,
        reference: approvedTx.reference,
        beneficiaryName: approvedTx.beneficiary?.name,
      }).catch((err) => console.error("[Email] Transfer approval email failed:", err));
    }

    return NextResponse.json({ message: "Transaction approved and completed." });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (error.message === "TRANSACTION_NOT_FOUND") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      if (error.message === "TRANSACTION_NOT_PENDING") return NextResponse.json({ error: "Transaction is not in pending state" }, { status: 400 });
      if (error.message === "ACCOUNT_NOT_ACTIVE") return NextResponse.json({ error: "Source account is not active" }, { status: 400 });
      if (error.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
    console.error("Approve transaction error:", error);
    return NextResponse.json({ error: "Approval failed. Please try again." }, { status: 500 });
  }
}
