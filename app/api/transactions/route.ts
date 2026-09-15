import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify account belongs to user if filtering by account
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });
      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
    }

    const userAccounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = accountId
      ? [accountId]
      : userAccounts.map((a) => a.id);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { accountId: { in: accountIds } },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          beneficiary: {
            select: {
              id: true,
              name: true,
              bankName: true,
              accountNumber: true,
            },
          },
          account: {
            select: {
              id: true,
              accountType: true,
              accountNumber: true,
            },
          },
        },
      }),
      prisma.transaction.count({
        where: { accountId: { in: accountIds } },
      }),
    ]);

    return NextResponse.json({ transactions, total, limit, offset });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Transactions error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
