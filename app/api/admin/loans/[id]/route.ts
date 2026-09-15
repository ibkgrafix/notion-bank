import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { notifyLoanDecision } from "@/lib/notifications";
import { sendLoanDecisionEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const adminSession = requireAdmin(session);

    const { id } = await params;
    const body = await request.json();
    const { action, adminNote, approvedAmount, interestRate, termMonths } = body;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    if (loan.status !== "PENDING") {
      return NextResponse.json({ error: "Loan is not in pending state" }, { status: 400 });
    }

    if (action === "approve") {
      const approvedCents = approvedAmount
        ? Math.round(parseFloat(approvedAmount) * 100)
        : loan.requestedCents;

      const rate = interestRate || 7.99;
      const months = termMonths || loan.termMonths;
      const monthlyRate = rate / 100 / 12;
      const monthlyPayCents = Math.round(
        (approvedCents * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
      );

      await prisma.loan.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedCents,
          interestRate: rate,
          termMonths: months,
          monthlyPayCents,
          adminNote: adminNote || null,
          updatedAt: new Date(),
        },
      });

      await notifyLoanDecision(loan.userId, true, approvedCents, adminNote);
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_APPROVED_LOAN",
        entityType: "Loan",
        entityId: id,
        description: `Admin approved ${loan.loanType} loan for $${(approvedCents / 100).toFixed(2)} for ${loan.user.email}`,
        metadata: { approvedCents, interestRate: rate, termMonths: months, adminNote },
      });

      // Send email
      sendLoanDecisionEmail({
        to: loan.user.email,
        firstName: loan.user.firstName,
        approved: true,
        loanType: loan.loanType,
        requestedAmount: loan.requestedCents,
        approvedAmount: approvedCents,
        interestRate: rate,
        termMonths: months,
        monthlyPayment: monthlyPayCents,
        adminNote: adminNote || undefined,
      }).catch((err) => console.error("[Email] Loan approval email failed:", err));

      return NextResponse.json({ message: "Loan approved successfully." });
    }

    if (action === "decline") {
      await prisma.loan.update({
        where: { id },
        data: { status: "DECLINED", adminNote: adminNote || null, updatedAt: new Date() },
      });

      await notifyLoanDecision(loan.userId, false, loan.requestedCents, adminNote);
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_DECLINED_LOAN",
        entityType: "Loan",
        entityId: id,
        description: `Admin declined ${loan.loanType} loan application for ${loan.user.email}${adminNote ? `. Note: ${adminNote}` : ""}`,
        metadata: { adminNote },
      });

      // Send email
      sendLoanDecisionEmail({
        to: loan.user.email,
        firstName: loan.user.firstName,
        approved: false,
        loanType: loan.loanType,
        requestedAmount: loan.requestedCents,
        adminNote: adminNote || undefined,
      }).catch((err) => console.error("[Email] Loan decline email failed:", err));

      return NextResponse.json({ message: "Loan application declined." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Loan action error:", error);
    return NextResponse.json({ error: "Action failed. Please try again." }, { status: 500 });
  }
}
