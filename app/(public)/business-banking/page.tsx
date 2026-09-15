import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Business Banking" };
export default function BusinessBankingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <Briefcase className="mx-auto mb-4 h-12 w-12 opacity-80" />
          <h1 className="text-4xl font-bold">Business Banking</h1>
          <p className="mt-4 text-xl text-blue-200">Banking solutions built for businesses of every size.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Open Business Account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { t: "Business Checking", d: "No transaction fees for the first 200 monthly transactions. Free ACH transfers." },
              { t: "Business Savings", d: "Earn 3.75% APY on business savings balances of any size." },
              { t: "Business Line of Credit", d: "Flexible credit from $10,000 to $500,000 for working capital needs." },
            ].map(({ t, d }) => (
              <div key={t} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{t}</h3>
                <p className="text-sm text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
