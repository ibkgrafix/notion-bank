import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

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
