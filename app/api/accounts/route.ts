import { NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        accountType: true,
        accountNumber: true,
        routingNumber: true,
        balanceCents: true,
        availableCents: true,
        status: true,
        openedAt: true,
        interestRate: true,
        nickname: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Accounts error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
