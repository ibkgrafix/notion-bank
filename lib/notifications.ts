import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata !== undefined
        ? params.metadata as Prisma.InputJsonValue
        : Prisma.JsonNull,
    },
  });
}

export async function notifyTransferInitiated(
  userId: string,
  amount: number,
  reference: string
): Promise<void> {
  await createNotification({
    userId,
    type: "TRANSFER",
    title: "Transfer Submitted",
    message: `Your transfer of $${(amount / 100).toFixed(2)} (ref: ${reference}) has been submitted and is pending review.`,
    metadata: { reference, amount },
  });
}

export async function notifyTransferApproved(
  userId: string,
  amount: number,
  reference: string
): Promise<void> {
  await createNotification({
    userId,
    type: "TRANSFER",
    title: "Transfer Approved",
    message: `Your transfer of $${(amount / 100).toFixed(2)} (ref: ${reference}) has been approved and completed.`,
    metadata: { reference, amount },
  });
}

export async function notifyTransferDeclined(
  userId: string,
  amount: number,
  reference: string,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "TRANSFER",
    title: "Transfer Declined",
    message: `Your transfer of $${(amount / 100).toFixed(2)} (ref: ${reference}) was declined.${reason ? ` Reason: ${reason}` : ""}`,
    metadata: { reference, amount, reason },
  });
}

export async function notifyLoanDecision(
  userId: string,
  approved: boolean,
  amount: number,
  note?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "LOAN",
    title: approved ? "Loan Application Approved" : "Loan Application Declined",
    message: approved
      ? `Congratulations! Your loan application for $${(amount / 100).toFixed(2)} has been approved.`
      : `Your loan application for $${(amount / 100).toFixed(2)} was not approved.${note ? ` ${note}` : ""}`,
    metadata: { amount, approved },
  });
}

export async function notifyAccountFrozen(
  userId: string,
  accountNumber: string
): Promise<void> {
  await createNotification({
    userId,
    type: "ACCOUNT",
    title: "Account Frozen",
    message: `Your account ending in ${accountNumber.slice(-4)} has been frozen. Please contact support for assistance.`,
  });
}

export async function notifyAccountUnfrozen(
  userId: string,
  accountNumber: string
): Promise<void> {
  await createNotification({
    userId,
    type: "ACCOUNT",
    title: "Account Restored",
    message: `Your account ending in ${accountNumber.slice(-4)} has been restored and is now active.`,
  });
}

export async function notifyPasswordReset(userId: string): Promise<void> {
  await createNotification({
    userId,
    type: "SECURITY",
    title: "Password Reset Initiated",
    message:
      "A password reset has been initiated for your account. If you did not request this, please contact support immediately.",
  });
}

export async function notifyCardStatusChange(
  userId: string,
  lastFour: string,
  status: string
): Promise<void> {
  const statusMap: Record<string, string> = {
    FROZEN: "frozen",
    ACTIVE: "unfrozen/activated",
    BLOCKED: "blocked",
  };
  await createNotification({
    userId,
    type: "CARD",
    title: "Card Status Updated",
    message: `Your card ending in ${lastFour} has been ${statusMap[status] || status.toLowerCase()}.`,
    metadata: { lastFour, status },
  });
}
