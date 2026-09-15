import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { sendTransferStatusEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const adminSession = requireAdmin(session);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNote = body?.adminNote || "";

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: {
          account: { include: { user: true } },
        },
      });

      if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
      if (transaction.status !== "PENDING") throw new Error("TRANSACTION_NOT_PENDING");

      // Restore available balance (it was held at initiation)
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { availableCents: { increment: transaction.amountCents } },
      });

      await tx.transaction.update({
        where: { id },
        data: {
          status: "DECLINED",
          declinedBy: adminSession.userId,
          adminNote: adminNote || null,
          updatedAt: new Date(),
        },
      });

      // Notify customer
      await tx.notification.create({
        data: {
          userId: transaction.account.userId,
          type: "TRANSFER",
          title: "Transfer Declined",
          message: `Your transfer of $${(transaction.amountCents / 100).toFixed(2)} (ref: ${transaction.reference}) was declined.${adminNote ? ` Reason: ${adminNote}` : ""}`,
          metadata: { reference: transaction.reference, amountCents: transaction.amountCents, reason: adminNote },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: adminSession.userId,
          action: "ADMIN_DECLINED_TRANSACTION",
          entityType: "Transaction",
          entityId: id,
          description: `Admin declined transaction ${transaction.reference} for $${(transaction.amountCents / 100).toFixed(2)} from ${transaction.account.user.email}${adminNote ? `. Note: ${adminNote}` : ""}`,
          metadata: {
            reference: transaction.reference,
            amountCents: transaction.amountCents,
            adminNote,
            userId: transaction.account.userId,
          },
        },
      });
    });

    // Send decline email (non-blocking)
    const declinedTx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: { include: { user: { select: { email: true, firstName: true } } } },
        beneficiary: { select: { name: true } },
      },
    });
    if (declinedTx) {
      sendTransferStatusEmail({
        to: declinedTx.account.user.email,
        firstName: declinedTx.account.user.firstName,
        status: "declined",
        amount: declinedTx.amountCents,
        reference: declinedTx.reference,
        beneficiaryName: declinedTx.beneficiary?.name,
        adminNote: adminNote || undefined,
      }).catch((err) => console.error("[Email] Transfer decline email failed:", err));
    }

    return NextResponse.json({ message: "Transaction declined." });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (error.message === "TRANSACTION_NOT_FOUND") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      if (error.message === "TRANSACTION_NOT_PENDING") return NextResponse.json({ error: "Transaction is not pending" }, { status: 400 });
    }
    console.error("Decline transaction error:", error);
    return NextResponse.json({ error: "Decline failed. Please try again." }, { status: 500 });
  }
}
