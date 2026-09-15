import Link from "next/link";
import { ArrowRight, DollarSign, TrendingUp, CreditCard, Home, Briefcase } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Personal Banking" };
const products = [
  { icon: DollarSign, title: "Checking Account", desc: "Everyday banking with no monthly fees, free ATM access nationwide, and real-time alerts.", rate: null, cta: "Open Checking", href: "/checking" },
  { icon: TrendingUp, title: "Savings Account", desc: "Grow your money faster with our high-yield savings account earning 4.50% APY.", rate: "4.50% APY", cta: "Open Savings", href: "/savings" },
  { icon: CreditCard, title: "Credit Cards", desc: "Earn cash back on every purchase with no annual fee and valuable perks.", rate: "2% cash back", cta: "View Cards", href: "/cards" },
  { icon: Home, title: "Mortgages", desc: "Finance your dream home with competitive rates and expert guidance every step of the way.", rate: "From 6.25%", cta: "Explore Mortgages", href: "/mortgages" },
  { icon: Briefcase, title: "Personal Loans", desc: "Get funds for any purpose with fixed rates, flexible terms, and fast approval.", rate: "From 7.99%", cta: "Apply Now", href: "/loans" },
];
export default function PersonalBankingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Personal Banking</h1>
          <p className="mt-4 text-xl text-blue-200 max-w-2xl mx-auto">
            Everything you need to manage, save, and grow your money — all in one place.
          </p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors">
            Open Account Free <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card hover:shadow-card-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <p.icon className="h-6 w-6" />
                </div>
                {p.rate && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold-600">{p.rate}</div>}
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{p.title}</h3>
                <p className="mb-4 text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                <Link href={p.href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:gap-2 transition-all">
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
