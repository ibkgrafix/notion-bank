import Link from "next/link";
import { CheckCircle2, ArrowRight, DollarSign } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Checking Accounts" };
const perks = [
  "No monthly maintenance fees",
  "Free access to 55,000+ ATMs nationwide",
  "Real-time transaction alerts",
  "Mobile check deposit",
  "Zelle® money transfers",
  "Overdraft protection options",
  "FDIC insured up to $250,000",
];
export default function CheckingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <DollarSign className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">NorthVault Checking</h1>
          <p className="mt-4 text-xl text-blue-200">No fees. No minimums. No hassle.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Open Account Free
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">Everything included. Nothing extra.</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-card">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <span className="text-sm font-medium text-gray-700">{p}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700 transition-colors">
              Open Checking Account <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
