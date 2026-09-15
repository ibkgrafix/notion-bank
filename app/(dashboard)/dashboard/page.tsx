import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  FileText,
  TrendingUp,
  Plus,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/utils";
import { Badge, getTransactionStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, accounts, recentTransactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true },
    }),
    prisma.account.findMany({
      where: { userId: session.userId },
      orderBy: { accountType: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        account: { userId: session.userId },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        account: { select: { accountType: true } },
        beneficiary: { select: { name: true } },
      },
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balanceCents, 0);
  const totalAvailable = accounts.reduce((sum, a) => sum + a.availableCents, 0);
  const checking = accounts.find((a) => a.accountType === "CHECKING");
  const savings = accounts.find((a) => a.accountType === "SAVINGS");

  const quickActions = [
    { label: "Transfer", href: "/dashboard/transfers", icon: ArrowLeftRight, color: "bg-blue-50 text-blue-600" },
    { label: "Bill Pay", href: "/dashboard/payments", icon: Receipt, color: "bg-green-50 text-green-600" },
    { label: "Cards", href: "/dashboard/cards", icon: CreditCard, color: "bg-purple-50 text-purple-600" },
    { label: "Statements", href: "/dashboard/statements", icon: FileText, color: "bg-amber-50 text-amber-600" },
    { label: "Apply for Loan", href: "/dashboard/loans", icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's a summary of your accounts.
        </p>
      </div>

      {/* Balance summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-brand-200 bg-gradient-to-br from-brand-700 to-brand-600 text-white border-0 shadow-card-lg">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-blue-200">Total Balance</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="mt-1 text-sm text-blue-200">
              Available: {formatCurrency(totalAvailable)}
            </p>
          </CardContent>
        </Card>

        {checking && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Checking
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(checking.balanceCents)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {maskAccountNumber(checking.accountNumber)}
                  </p>
                </div>
                <Link
                  href="/dashboard/accounts"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3">
                <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {savings && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Savings
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(savings.balanceCents)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {maskAccountNumber(savings.accountNumber)}
                  </p>
                </div>
                <Link
                  href="/dashboard/accounts"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>4.50% APY</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map(({ label, href, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Link
              href="/dashboard/accounts"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ArrowLeftRight className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Your transaction history will appear here.
              </p>
              <Link
                href="/dashboard/transfers"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" />
                Make a Transfer
              </Link>
            </div>
          ) : (
            <div className="space-y-0 -mx-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="hidden sm:table-cell">Type</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                            tx.type === "DEPOSIT" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                          }`}>
                            {tx.type === "DEPOSIT" ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="max-w-[160px] truncate text-sm font-medium text-gray-900 sm:max-w-none">
                              {tx.description || tx.beneficiary?.name || tx.type}
                            </p>
                            <p className="text-xs text-gray-400">{tx.account.accountType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{tx.type}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                      </td>
                      <td>
                        <span className={`text-sm font-semibold ${
                          tx.type === "DEPOSIT" ? "text-green-600" : "text-gray-900"
                        }`}>
                          {tx.type === "DEPOSIT" ? "+" : "-"}
                          {formatCurrency(tx.amountCents)}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getTransactionStatusVariant(tx.status)} dot>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
