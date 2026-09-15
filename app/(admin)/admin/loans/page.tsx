import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, getLoanStatusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoanActions } from "@/components/admin/loan-actions";
import { Landmark } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loan Management" };

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");

  const params = await searchParams;
  const statusFilter = params.status || "";
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.loan.count({ where }),
  ]);

  const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "DECLINED", "ACTIVE", "PAID_OFF"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Loans</h1><p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} total applications</p></div>

      <Card>
        <CardContent className="pt-5">
          <form className="flex gap-3">
            <select name="status" defaultValue={statusFilter} className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
            <button type="submit" className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Filter</button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loans.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center"><Landmark className="h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No loan applications found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Type</th>
                    <th>Requested</th>
                    <th className="hidden md:table-cell">Term</th>
                    <th className="hidden lg:table-cell">Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <Link href={`/admin/users/${loan.user.id}`} className="text-sm font-medium text-brand-600 hover:underline">{loan.user.firstName} {loan.user.lastName}</Link>
                        <p className="text-xs text-gray-400">{loan.user.email}</p>
                      </td>
                      <td><span className="text-sm text-gray-700">{loan.loanType.replace("_", " ")}</span></td>
                      <td><span className="text-sm font-semibold">{formatCurrency(loan.requestedCents)}</span></td>
                      <td className="hidden md:table-cell"><span className="text-sm text-gray-600">{loan.termMonths} months</span></td>
                      <td className="hidden lg:table-cell"><span className="text-sm text-gray-500">{formatDate(loan.createdAt)}</span></td>
                      <td><Badge variant={getLoanStatusVariant(loan.status)} dot>{loan.status}</Badge></td>
                      <td>{loan.status === "PENDING" ? <LoanActions loanId={loan.id} requestedCents={loan.requestedCents} termMonths={loan.termMonths} /> : <span className="text-xs text-gray-400">—</span>}</td>
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
