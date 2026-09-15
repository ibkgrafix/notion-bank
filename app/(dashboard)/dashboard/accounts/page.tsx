import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  TrendingUp,
  Copy,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, maskAccountNumber, ROUTING_NUMBER } from "@/lib/utils";
import { Badge, getTransactionStatusVariant, getAccountStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Accounts" };

export default async function AccountsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { userId: session.userId },
    orderBy: { accountType: "asc" },
  });

  const allAccountIds = accounts.map((a) => a.id);
  const transactions = await prisma.transaction.findMany({
    where: { accountId: { in: allAccountIds } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      account: { select: { accountType: true, accountNumber: true } },
      beneficiary: { select: { name: true, bankName: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your account details and transaction history.
        </p>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <div className={`h-1.5 w-full ${account.accountType === "CHECKING" ? "bg-brand-600" : "bg-green-500"}`} />
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${account.accountType === "CHECKING" ? "bg-brand-50 text-brand-600" : "bg-green-50 text-green-600"}`}>
                      {account.accountType === "CHECKING" ? <Building2 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {account.accountType === "CHECKING" ? "Checking Account" : "Savings Account"}
                      </p>
                      <p className="text-xs text-gray-400">{maskAccountNumber(account.accountNumber)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balanceCents)}</p>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-gray-400">Available Balance</p>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(account.availableCents)}</p>
                  </div>
                </div>
                <Badge variant={getAccountStatusVariant(account.status)} dot>
                  {account.status}
                </Badge>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Account Number</span>
                  <span className="font-mono font-medium text-gray-700">{maskAccountNumber(account.accountNumber)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Routing Number</span>
                  <span className="font-mono font-medium text-gray-700">{ROUTING_NUMBER}</span>
                </div>
                {account.accountType === "SAVINGS" && account.interestRate > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Interest Rate</span>
                    <span className="font-medium text-green-600">{account.interestRate}% APY</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Opened</span>
                  <span className="text-gray-700">{formatDate(account.openedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All recent account activity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-500">No transactions yet.</p>
              <Link href="/dashboard/transfers" className="mt-3 text-sm font-medium text-brand-600 hover:underline">
                Make your first transfer
              </Link>
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="hidden sm:table-cell">Account</th>
                    <th className="hidden md:table-cell">Reference</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs ${tx.type === "DEPOSIT" || tx.type === "REFUND" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                            {tx.type === "DEPOSIT" || tx.type === "REFUND" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <p className="max-w-[140px] truncate text-sm font-medium text-gray-900 sm:max-w-[200px]">
                              {tx.description || tx.beneficiary?.name || tx.type}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{tx.account.accountType}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-400">{tx.reference.slice(-8)}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-sm text-gray-500">{formatDate(tx.createdAt)}</span>
                      </td>
                      <td>
                        <span className={`text-sm font-semibold ${tx.type === "DEPOSIT" || tx.type === "REFUND" ? "text-green-600" : "text-gray-900"}`}>
                          {tx.type === "DEPOSIT" || tx.type === "REFUND" ? "+" : "-"}
                          {formatCurrency(tx.amountCents)}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getTransactionStatusVariant(tx.status)}>
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
