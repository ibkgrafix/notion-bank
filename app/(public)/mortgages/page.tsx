import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mortgages" };
export default function MortgagesPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <Home className="mx-auto mb-4 h-12 w-12 opacity-80" />
          <h1 className="text-4xl font-bold">Home Loans</h1>
          <p className="mt-4 text-xl text-blue-200">Competitive rates on 15 and 30-year fixed mortgages.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Get Pre-Qualified <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "30-Year Fixed", rate: "6.50%", apr: "6.62% APR", desc: "Stable monthly payments over 30 years." },
              { title: "15-Year Fixed", rate: "6.25%", apr: "6.40% APR", desc: "Build equity faster with lower total interest." },
              { title: "FHA Loan", rate: "6.75%", apr: "6.88% APR", desc: "Low down payment option for first-time buyers." },
            ].map((m) => (
              <div key={m.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card text-center">
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{m.title}</h3>
                <div className="my-3 text-3xl font-bold text-brand-700">{m.rate}</div>
                <div className="text-sm text-gray-400">{m.apr}</div>
                <p className="mt-3 text-sm text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
