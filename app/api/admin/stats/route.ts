import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    requireAdmin(session);

    const [
      totalCustomers,
      activeAccounts,
      pendingTransactions,
      completedTransactions,
      declinedTransactions,
      pendingLoans,
      activeCards,
      totalDepositsResult,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.account.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: "COMPLETED" } }),
      prisma.transaction.count({ where: { status: "DECLINED" } }),
      prisma.loan.count({ where: { status: "PENDING" } }),
      prisma.card.count({ where: { status: "ACTIVE" } }),
      prisma.account.aggregate({ _sum: { balanceCents: true } }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          admin: { select: { firstName: true, lastName: true, role: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalCustomers,
      activeAccounts,
      pendingTransactions,
      completedTransactions,
      declinedTransactions,
      pendingLoans,
      activeCards,
      totalDepositsCents: totalDepositsResult._sum.balanceCents || 0,
      recentAuditLogs,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
