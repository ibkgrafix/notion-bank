import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyCardStatusChange } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify card belongs to the authenticated user
    const card = await prisma.card.findFirst({
      where: { id, userId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (action === "freeze") {
      if (card.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Only active cards can be frozen." },
          { status: 400 }
        );
      }
      const updated = await prisma.card.update({
        where: { id },
        data: { status: "FROZEN" },
      });
      await notifyCardStatusChange(userId, card.lastFour, "FROZEN");
      return NextResponse.json({ card: updated });
    }

    if (action === "unfreeze") {
      if (card.status !== "FROZEN") {
        return NextResponse.json(
          { error: "Only frozen cards can be unfrozen." },
          { status: 400 }
        );
      }
      const updated = await prisma.card.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      await notifyCardStatusChange(userId, card.lastFour, "ACTIVE");
      return NextResponse.json({ card: updated });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Card action error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
