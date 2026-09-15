import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { notifyAccountFrozen, notifyAccountUnfrozen, notifyPasswordReset } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    requireAdmin(session);

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        accounts: {
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
          },
        },
        cards: {
          select: {
            id: true,
            cardType: true,
            lastFour: true,
            cardholderName: true,
            expirationMonth: true,
            expirationYear: true,
            status: true,
            networkBrand: true,
            account: { select: { accountType: true } },
          },
        },
        loans: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            loanType: true,
            requestedCents: true,
            approvedCents: true,
            status: true,
            createdAt: true,
          },
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            read: true,
            createdAt: true,
          },
        },
        sessions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            success: true,
            createdAt: true,
            expiresAt: true,
            invalidatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent transactions for user's accounts
    const accountIds = user.accounts.map((a) => a.id);
    const transactions = await prisma.transaction.findMany({
      where: { accountId: { in: accountIds } },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        beneficiary: { select: { name: true, bankName: true } },
        account: { select: { accountType: true, accountNumber: true } },
      },
    });

    return NextResponse.json({ user, transactions });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const adminSession = requireAdmin(session);

    const { id } = await params;
    const body = await request.json();
    const { action, accountId, note } = body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "freeze_account") {
      const account = user.accounts.find((a) => a.id === accountId);
      if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      await prisma.account.update({
        where: { id: accountId },
        data: { status: "FROZEN" },
      });

      await notifyAccountFrozen(id, account.accountNumber);
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_FROZE_ACCOUNT",
        entityType: "Account",
        entityId: accountId,
        description: `Admin froze account ${account.accountNumber} for user ${user.email}`,
        metadata: { note },
      });

      return NextResponse.json({ message: "Account frozen successfully" });
    }

    if (action === "unfreeze_account") {
      const account = user.accounts.find((a) => a.id === accountId);
      if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      await prisma.account.update({
        where: { id: accountId },
        data: { status: "ACTIVE" },
      });

      await notifyAccountUnfrozen(id, account.accountNumber);
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_UNFROZE_ACCOUNT",
        entityType: "Account",
        entityId: accountId,
        description: `Admin unfroze account ${account.accountNumber} for user ${user.email}`,
      });

      return NextResponse.json({ message: "Account unfrozen successfully" });
    }

    if (action === "suspend_user") {
      await prisma.user.update({ where: { id }, data: { status: "SUSPENDED" } });
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_SUSPENDED_USER",
        entityType: "User",
        entityId: id,
        description: `Admin suspended user ${user.email}`,
        metadata: { note },
      });
      return NextResponse.json({ message: "User suspended" });
    }

    if (action === "activate_user") {
      await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_ACTIVATED_USER",
        entityType: "User",
        entityId: id,
        description: `Admin activated user ${user.email}`,
      });
      return NextResponse.json({ message: "User activated" });
    }

    if (action === "initiate_password_reset") {
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.passwordReset.updateMany({
        where: { userId: id, used: false },
        data: { used: true },
      });

      await prisma.passwordReset.create({
        data: { userId: id, token, expiresAt },
      });

      await notifyPasswordReset(id);
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_INITIATED_PASSWORD_RESET",
        entityType: "User",
        entityId: id,
        description: `Admin initiated password reset for user ${user.email}`,
      });

      return NextResponse.json({
        message: "Password reset initiated",
        ...(process.env.NODE_ENV === "development" && {
          devToken: token,
          resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`,
        }),
      });
    }

    if (action === "send_notification") {
      const { title, message } = body;
      if (!title || !message) {
        return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
      }
      await prisma.notification.create({
        data: { userId: id, type: "SYSTEM", title, message },
      });
      await createAuditLog({
        adminId: adminSession.userId,
        action: "ADMIN_SENT_NOTIFICATION",
        entityType: "User",
        entityId: id,
        description: `Admin sent notification to user ${user.email}: "${title}"`,
      });
      return NextResponse.json({ message: "Notification sent" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
