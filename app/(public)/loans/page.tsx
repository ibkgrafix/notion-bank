import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Loans" };
const loanTypes = [
  { title: "Personal Loan", rate: "From 7.99% APR", term: "12–84 months", amount: "$1,000–$50,000", desc: "Fund any major purchase or consolidate debt with a fixed-rate personal loan." },
  { title: "Auto Loan", rate: "From 5.49% APR", term: "24–72 months", amount: "$5,000–$100,000", desc: "Drive your dream car with competitive rates and quick approvals." },
  { title: "Student Loan", rate: "From 4.99% APR", term: "Up to 120 months", amount: "$1,000–$150,000", desc: "Invest in your education with flexible repayment options." },
  { title: "Business Loan", rate: "From 6.99% APR", term: "12–120 months", amount: "$10,000–$500,000", desc: "Grow your business with flexible financing tailored to your needs." },
];
export default function LoansPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold sm:text-5xl">Loans for every goal</h1>
          <p className="mt-4 text-xl text-blue-200">Simple applications, competitive rates, fast decisions.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Apply Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {loanTypes.map((l) => (
              <div key={l.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{l.title}</h3>
                <div className="mb-3 text-2xl font-bold text-brand-700">{l.rate}</div>
                <p className="mb-4 text-sm text-gray-500">{l.desc}</p>
                <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-100 pt-4">
                  <span>Term: {l.term}</span>
                  <span>Amount: {l.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
