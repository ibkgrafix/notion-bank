import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime, maskAccountNumber } from "@/lib/utils";
import { Badge, getTransactionStatusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionActions } from "@/components/admin/transaction-actions";
import { Search, ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Transaction Management" };

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; search?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");

  const params = await searchParams;
  const statusFilter = params.status || "";
  const typeFilter = params.type || "";
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: Prisma.TransactionWhereInput = {};
  if (statusFilter) where.status = statusFilter as Prisma.EnumTransactionStatusFilter;
  if (typeFilter) where.type = typeFilter as Prisma.EnumTransactionTypeFilter;
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { account: { user: { email: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        beneficiary: { select: { name: true, bankName: true, accountNumber: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const buildUrl = (overrides: Record<string, string>) => {
    const p = { status: statusFilter, type: typeFilter, search, page: "1", ...overrides };
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v)));
    return `/admin/transactions?${qs}`;
  };

  const STATUS_OPTIONS = ["", "PENDING", "COMPLETED", "APPROVED", "DECLINED", "FAILED", "CANCELLED"];
  const TYPE_OPTIONS = ["", "TRANSFER", "DEPOSIT", "WITHDRAWAL", "PAYMENT", "CARD_PAYMENT", "FEE", "REFUND"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} transaction{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input name="search" defaultValue={search} placeholder="Search reference or email..." className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <select name="status" defaultValue={statusFilter} className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
            <select name="type" defaultValue={typeFilter} className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none">
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || "All Types"}</option>)}
            </select>
            <button type="submit" className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Filter</button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Banner */}
      {statusFilter === "PENDING" && transactions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{total} pending transaction{total !== 1 ? "s" : ""}</strong> require{total === 1 ? "s" : ""} review. Approve or decline each one below.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ArrowLeftRight className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Type</th>
                    <th>Amount</th>
                    <th className="hidden md:table-cell">Beneficiary</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div>
                          <Link href={`/admin/users/${tx.account.user.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                            {tx.account.user.firstName} {tx.account.user.lastName}
                          </Link>
                          <p className="text-xs text-gray-400">{tx.account.accountType} · {tx.reference.slice(-8)}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell"><span className="text-xs text-gray-600">{tx.type}</span></td>
                      <td><span className="text-sm font-semibold text-gray-900">{formatCurrency(tx.amountCents)}</span></td>
                      <td className="hidden md:table-cell">
                        {tx.beneficiary ? (
                          <div>
                            <p className="text-sm text-gray-900">{tx.beneficiary.name}</p>
                            <p className="text-xs text-gray-400">{tx.beneficiary.bankName}</p>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(tx.createdAt)}</span>
                      </td>
                      <td><Badge variant={getTransactionStatusVariant(tx.status)} dot>{tx.status}</Badge></td>
                      <td>
                        {tx.status === "PENDING" ? (
                          <TransactionActions transactionId={tx.id} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Previous</Link>}
            {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
