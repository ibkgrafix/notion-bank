import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "ADMIN_APPROVED_TRANSACTION"
  | "ADMIN_DECLINED_TRANSACTION"
  | "ADMIN_FROZE_ACCOUNT"
  | "ADMIN_UNFROZE_ACCOUNT"
  | "ADMIN_APPROVED_LOAN"
  | "ADMIN_DECLINED_LOAN"
  | "ADMIN_INITIATED_PASSWORD_RESET"
  | "ADMIN_UPDATED_ACCOUNT"
  | "ADMIN_BLOCKED_CARD"
  | "ADMIN_UNBLOCKED_CARD"
  | "ADMIN_FROZEN_CARD"
  | "ADMIN_UNFROZEN_CARD"
  | "ADMIN_SUSPENDED_USER"
  | "ADMIN_ACTIVATED_USER"
  | "ADMIN_SENT_NOTIFICATION"
  | "ADMIN_VIEWED_USER"
  | "USER_REGISTERED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_PASSWORD_CHANGED"
  | "TRANSFER_INITIATED"
  | "LOAN_APPLIED";

export async function createAuditLog(params: {
  adminId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata !== undefined
        ? params.metadata as Prisma.InputJsonValue
        : Prisma.JsonNull,
    },
  });
}
