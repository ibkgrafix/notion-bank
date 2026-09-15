import Link from "next/link";
import { CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cards" };
export default function CardsPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold">Cards that reward you</h1>
          <p className="mt-4 text-xl text-blue-200">2% cash back on every purchase. No annual fee. No exceptions.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Apply Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {([
              ["NorthVault Rewards", "2% cash back on all purchases", "0% intro APR for 15 months", "No annual fee", "FDIC insured deposits"],
              ["NorthVault Platinum", "1.5% cash back", "0% intro APR for 12 months", "No annual fee", "Priority customer support"],
              ["NorthVault Business", "3% on business purchases", "Expense tracking tools", "No annual fee", "Employee cards included"],
            ] as string[][]).map(([title, ...perks]) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
                <CreditCard className="mb-4 h-8 w-8 text-brand-600" />
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{title}</h3>
                <ul className="space-y-2">
                  {perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
