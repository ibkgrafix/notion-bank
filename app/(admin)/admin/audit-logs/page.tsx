import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log" };

const actionColors: Record<string, string> = {
  ADMIN_APPROVED_TRANSACTION: "text-green-700 bg-green-50",
  ADMIN_DECLINED_TRANSACTION: "text-red-700 bg-red-50",
  ADMIN_FROZE_ACCOUNT: "text-amber-700 bg-amber-50",
  ADMIN_UNFROZE_ACCOUNT: "text-green-700 bg-green-50",
  ADMIN_APPROVED_LOAN: "text-green-700 bg-green-50",
  ADMIN_DECLINED_LOAN: "text-red-700 bg-red-50",
  ADMIN_INITIATED_PASSWORD_RESET: "text-blue-700 bg-blue-50",
  ADMIN_BLOCKED_CARD: "text-red-700 bg-red-50",
  ADMIN_SUSPENDED_USER: "text-red-700 bg-red-50",
  ADMIN_ACTIVATED_USER: "text-green-700 bg-green-50",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");

  const params = await searchParams;
  const actionFilter = params.action || "";
  const page = parseInt(params.page || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (actionFilter) where.action = actionFilter;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { firstName: true, lastName: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">Complete record of all administrative actions.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No audit records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.description}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          By: {log.admin.firstName} {log.admin.lastName}
                          {log.entityId && ` · Entity: ${log.entityId.slice(0, 8)}...`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <p className="mt-1 text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/audit-logs?page=${page - 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Previous</Link>}
            {page < totalPages && <Link href={`/admin/audit-logs?page=${page + 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
