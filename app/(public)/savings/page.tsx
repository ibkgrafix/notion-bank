import Link from "next/link";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Savings Accounts" };
const perks = [
  "4.50% Annual Percentage Yield (APY)",
  "No minimum balance requirement",
  "No monthly maintenance fees",
  "FDIC insured up to $250,000",
  "Unlimited transfers to NorthVault accounts",
  "Automatic savings rules",
  "Interest compounded daily, paid monthly",
];
export default function SavingsPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-green-900 to-green-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="mb-2 text-5xl font-bold">4.50% APY</div>
          <h1 className="text-3xl font-bold">High-Yield Savings Account</h1>
          <p className="mt-4 text-xl text-green-200">Your money, working harder for you every single day.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-green-800 hover:bg-gray-100 transition-colors">
            Open Savings Account
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">Why save with NorthVault?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-card">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-sm font-medium text-gray-700">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
