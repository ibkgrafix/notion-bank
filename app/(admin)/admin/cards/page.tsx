import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, maskAccountNumber } from "@/lib/utils";
import { Badge, getCardStatusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCardActions } from "@/components/admin/admin-card-actions";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Card Management" };

export default async function AdminCardsPage({
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

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        account: { select: { accountType: true, accountNumber: true } },
      },
    }),
    prisma.card.count({ where }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Cards</h1><p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} total cards</p></div>

      <Card>
        <CardContent className="pt-5">
          <form className="flex gap-3">
            <select name="status" defaultValue={statusFilter} className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none">
              {["", "ACTIVE", "FROZEN", "BLOCKED", "EXPIRED", "PENDING"].map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
            <button type="submit" className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">Filter</button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center"><CreditCard className="h-10 w-10 text-gray-300" /><p className="mt-3 text-sm text-gray-500">No cards found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cardholder</th>
                    <th>Card</th>
                    <th className="hidden md:table-cell">Account</th>
                    <th className="hidden lg:table-cell">Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td>
                        <Link href={`/admin/users/${card.user.id}`} className="text-sm font-medium text-brand-600 hover:underline">{card.user.firstName} {card.user.lastName}</Link>
                        <p className="text-xs text-gray-400">{card.user.email}</p>
                      </td>
                      <td>
                        <p className="text-sm font-medium text-gray-900">{card.networkBrand} {card.cardType}</p>
                        <p className="font-mono text-xs text-gray-400">**** {card.lastFour}</p>
                      </td>
                      <td className="hidden md:table-cell">
                        <p className="text-sm text-gray-700">{card.account.accountType}</p>
                        <p className="text-xs text-gray-400">{maskAccountNumber(card.account.accountNumber)}</p>
                      </td>
                      <td className="hidden lg:table-cell"><span className="text-sm text-gray-600">{String(card.expirationMonth).padStart(2,"0")}/{String(card.expirationYear).slice(-2)}</span></td>
                      <td><Badge variant={getCardStatusVariant(card.status)} dot>{card.status}</Badge></td>
                      <td><AdminCardActions cardId={card.id} status={card.status} /></td>
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
