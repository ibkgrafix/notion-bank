import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { notifyCardStatusChange } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    requireAdmin(session);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Prisma.CardWhereInput = {};
    if (status) where.status = status as Prisma.EnumCardStatusFilter;

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          account: { select: { accountType: true, accountNumber: true } },
        },
      }),
      prisma.card.count({ where }),
    ]);

    return NextResponse.json({ cards, total, limit, offset });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const adminSession = requireAdmin(session);

    const body = await request.json();
    const { cardId, action } = body as { cardId: string; action: string };

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const statusMap: Record<string, "ACTIVE" | "FROZEN" | "BLOCKED"> = {
      freeze: "FROZEN",
      unfreeze: "ACTIVE",
      block: "BLOCKED",
    };

    const newStatus = statusMap[action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const auditActionMap: Record<string, "ADMIN_FROZEN_CARD" | "ADMIN_UNFROZEN_CARD" | "ADMIN_BLOCKED_CARD"> = {
      freeze: "ADMIN_FROZEN_CARD",
      unfreeze: "ADMIN_UNFROZEN_CARD",
      block: "ADMIN_BLOCKED_CARD",
    };

    await prisma.card.update({ where: { id: cardId }, data: { status: newStatus } });

    await notifyCardStatusChange(card.userId, card.lastFour, newStatus);
    await createAuditLog({
      adminId: adminSession.userId,
      action: auditActionMap[action],
      entityType: "Card",
      entityId: cardId,
      description: `Admin ${action}d card ending in ${card.lastFour}`,
    });

    return NextResponse.json({ message: `Card ${action}d successfully.` });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
