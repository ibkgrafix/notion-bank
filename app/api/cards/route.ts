import { NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const cards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          select: {
            id: true,
            accountType: true,
            accountNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ cards });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
