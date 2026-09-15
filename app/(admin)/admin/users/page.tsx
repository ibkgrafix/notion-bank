import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ChevronRight, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Management" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin");

  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "";
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = {
    role: "CUSTOMER" as const,
    ...(status && { status: status as "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING" }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        status: true, createdAt: true, lastLoginAt: true,
        accounts: { select: { balanceCents: true, status: true, accountType: true } },
        _count: { select: { accounts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} total customer{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or email..."
                className="h-9 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="LOCKED">Locked</option>
            </select>
            <button type="submit" className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No customers found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Accounts</th>
                    <th className="hidden md:table-cell">Total Balance</th>
                    <th className="hidden lg:table-cell">Joined</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const totalBalance = user.accounts.reduce((s, a) => s + a.balanceCents, 0);
                    return (
                      <tr key={user.id} className="group">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="text-sm text-gray-700">{user._count.accounts}</span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(totalBalance)}</span>
                        </td>
                        <td className="hidden lg:table-cell">
                          <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                        </td>
                        <td>
                          <Badge variant={
                            user.status === "ACTIVE" ? "success" :
                              user.status === "SUSPENDED" ? "danger" :
                                user.status === "LOCKED" ? "warning" : "neutral"
                          } dot>
                            {user.status}
                          </Badge>
                        </td>
                        <td>
                          <Link href={`/admin/users/${user.id}`} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/users?search=${search}&status=${status}&page=${page - 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/users?search=${search}&status=${status}&page=${page + 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
