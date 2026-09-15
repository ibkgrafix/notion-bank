import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, ArrowLeftRight, Landmark, CreditCard,
  CheckCircle2, XCircle, Clock, DollarSign,
  ChevronRight, Activity,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getTransactionStatusVariant } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [
    totalCustomers,
    activeAccounts,
    pendingTransactions,
    completedTransactions,
    declinedTransactions,
    pendingLoans,
    activeCards,
    totalDepositsResult,
    recentPendingTransactions,
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
    prisma.transaction.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        account: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        beneficiary: { select: { name: true, bankName: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Customers", value: totalCustomers.toLocaleString(), icon: Users, color: "text-blue-600 bg-blue-50", href: "/admin/users" },
    { label: "Active Accounts", value: activeAccounts.toLocaleString(), icon: Activity, color: "text-green-600 bg-green-50", href: "/admin/users" },
    { label: "Total Deposits", value: formatCurrency(totalDepositsResult._sum.balanceCents || 0), icon: DollarSign, color: "text-emerald-600 bg-emerald-50", href: "/admin/users" },
    { label: "Pending Reviews", value: pendingTransactions.toLocaleString(), icon: Clock, color: "text-amber-600 bg-amber-50", href: "/admin/transactions?status=PENDING", alert: pendingTransactions > 0 },
    { label: "Completed", value: completedTransactions.toLocaleString(), icon: CheckCircle2, color: "text-green-600 bg-green-50", href: "/admin/transactions?status=COMPLETED" },
    { label: "Declined", value: declinedTransactions.toLocaleString(), icon: XCircle, color: "text-red-600 bg-red-50", href: "/admin/transactions?status=DECLINED" },
    { label: "Loan Applications", value: pendingLoans.toLocaleString(), icon: Landmark, color: "text-purple-600 bg-purple-50", href: "/admin/loans", alert: pendingLoans > 0 },
    { label: "Active Cards", value: activeCards.toLocaleString(), icon: CreditCard, color: "text-indigo-600 bg-indigo-50", href: "/admin/cards" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">NorthVault Bank — Banking Operations Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <div className={`relative rounded-xl border bg-white p-5 shadow-card transition-shadow hover:shadow-card-lg ${stat.alert ? "border-amber-200" : "border-gray-200"}`}>
              {stat.alert && (
                <span className="absolute right-3 top-3 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Approvals</CardTitle>
              <Link href="/admin/transactions?status=PENDING" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPendingTransactions.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
                <p className="mt-2 text-sm font-medium text-gray-500">No pending transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPendingTransactions.map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/admin/transactions?status=PENDING`}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.account.user.firstName} {tx.account.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        To: {tx.beneficiary?.name || "N/A"} · {tx.reference.slice(-8)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.amountCents)}</p>
                      <Badge variant="warning" dot className="text-xs">PENDING</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/admin/audit-logs" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Full log <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No audit records yet.</p>
            ) : (
              <div className="space-y-2">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50">
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-400">
                        {log.admin.firstName} {log.admin.lastName} · {formatTimeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
