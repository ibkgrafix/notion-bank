import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, maskAccountNumber, ROUTING_NUMBER } from "@/lib/utils";
import { Badge, getTransactionStatusVariant, getAccountStatusVariant, getCardStatusVariant, getLoanStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUserActions } from "@/components/admin/admin-user-actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Detail" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: true,
      cards: { include: { account: { select: { accountType: true } } } },
      loans: { orderBy: { createdAt: "desc" }, take: 5 },
      sessions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!user || user.role !== "CUSTOMER") notFound();

  const transactions = await prisma.transaction.findMany({
    where: { account: { userId: id } },
    take: 15,
    orderBy: { createdAt: "desc" },
    include: {
      beneficiary: { select: { name: true, bankName: true } },
      account: { select: { accountType: true } },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>
        </div>
        <Badge variant={user.status === "ACTIVE" ? "success" : "danger"} dot className="ml-auto">
          {user.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Accounts */}
          <Card>
            <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {user.accounts.map((account) => (
                  <div key={account.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900">{account.accountType} Account</p>
                      <Badge variant={getAccountStatusVariant(account.status)}>{account.status}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balanceCents)}</p>
                    <p className="text-xs text-gray-400">Available: {formatCurrency(account.availableCents)}</p>
                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Account #</span>
                        <span className="font-mono">{maskAccountNumber(account.accountNumber)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Routing #</span>
                        <span className="font-mono">{ROUTING_NUMBER}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No transactions.</p>
              ) : (
                <div className="-mx-6 overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Description</th><th className="hidden sm:table-cell">Type</th><th>Amount</th><th>Status</th><th className="hidden md:table-cell">Date</th></tr></thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td><p className="max-w-[160px] truncate text-sm">{tx.description || tx.beneficiary?.name || tx.type}</p></td>
                          <td className="hidden sm:table-cell"><span className="text-xs text-gray-500">{tx.type}</span></td>
                          <td><span className="text-sm font-semibold">{formatCurrency(tx.amountCents)}</span></td>
                          <td><Badge variant={getTransactionStatusVariant(tx.status)}>{tx.status}</Badge></td>
                          <td className="hidden md:table-cell"><span className="text-xs text-gray-500">{formatDate(tx.createdAt)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards */}
          {user.cards.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Cards</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {user.cards.map((card) => (
                    <div key={card.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{card.networkBrand} {card.cardType}</p>
                          <p className="text-xs text-gray-400">**** {card.lastFour} · Exp {String(card.expirationMonth).padStart(2,"0")}/{String(card.expirationYear).slice(-2)}</p>
                          <p className="text-xs text-gray-400">{card.account.accountType}</p>
                        </div>
                        <Badge variant={getCardStatusVariant(card.status)}>{card.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Activity */}
          <Card>
            <CardHeader><CardTitle>Login Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.sessions.length === 0 ? <p className="text-sm text-gray-400">No login records.</p> : user.sessions.map((s) => (
                  <div key={s.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.userAgent?.substring(0, 60) || "Unknown device"}...</p>
                      <p className="text-xs text-gray-400">IP: {s.ipAddress || "Unknown"}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">{formatDateTime(s.createdAt)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {[
                  ["Name", `${user.firstName} ${user.lastName}`],
                  ["Email", user.email],
                  ["Phone", user.phone || "N/A"],
                  ["Address", user.addressLine1 || "N/A"],
                  ["City / State", user.city && user.state ? `${user.city}, ${user.state}` : "N/A"],
                  ["Joined", formatDate(user.createdAt)],
                  ["Last Login", user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-gray-50 py-1.5 last:border-0">
                    <dt className="text-gray-400 flex-shrink-0">{label}</dt>
                    <dd className="text-right font-medium text-gray-900 truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Loans */}
          {user.loans.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Loans</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.loans.map((loan) => (
                    <div key={loan.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{loan.loanType.replace("_", " ")}</p>
                        <Badge variant={getLoanStatusVariant(loan.status)}>{loan.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">{formatCurrency(loan.requestedCents)} · {loan.termMonths}mo</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <AdminUserActions user={{ id: user.id, status: user.status, accounts: user.accounts }} />
        </div>
      </div>
    </div>
  );
}
