import Link from "next/link";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Lock,
  TrendingUp,
  CreditCard,
  Home,
  DollarSign,
  Star,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Digital-First Banking",
    description: "Manage your accounts, transfers, and payments from any device with our intuitive online banking platform.",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description: "Multi-factor authentication, real-time fraud monitoring, and encrypted transactions protect your money 24/7.",
  },
  {
    icon: TrendingUp,
    title: "Competitive Rates",
    description: "Earn 4.50% APY on savings accounts and access competitive rates on loans and mortgages.",
  },
  {
    icon: Shield,
    title: "FDIC Insured",
    description: "Your deposits are insured up to $250,000 per depositor through FDIC coverage for peace of mind.",
  },
];

const products = [
  {
    icon: DollarSign,
    title: "Checking Accounts",
    description: "No monthly fees, free ATM access nationwide, and instant account setup.",
    href: "/checking",
    highlight: "No monthly fees",
  },
  {
    icon: TrendingUp,
    title: "Savings Accounts",
    description: "Earn 4.50% APY with no minimum balance requirements.",
    href: "/savings",
    highlight: "4.50% APY",
  },
  {
    icon: CreditCard,
    title: "Credit Cards",
    description: "Cash back rewards, no annual fee, and a 0% intro APR for 15 months.",
    href: "/cards",
    highlight: "2% cash back",
  },
  {
    icon: Home,
    title: "Mortgages",
    description: "Competitive mortgage rates with fast approvals and flexible terms.",
    href: "/mortgages",
    highlight: "From 6.25% APR",
  },
];

const stats = [
  { value: "2M+", label: "Customers Served" },
  { value: "$18B", label: "Assets Under Management" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "4.8★", label: "App Store Rating" },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 pb-24 pt-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-yellow-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Now offering 4.50% APY on savings
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Banking built for{" "}
              <span className="text-yellow-300">your future</span>
            </h1>
            <p className="mb-10 text-xl text-blue-100 leading-relaxed">
              NorthVault Bank combines the trust of traditional banking with the convenience of modern digital finance. Open an account in minutes.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 shadow-lg hover:bg-gray-100 transition-colors sm:w-auto"
              >
                Open Account Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/personal-banking"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white hover:bg-white/20 backdrop-blur-sm transition-colors sm:w-auto"
              >
                Explore Products
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
              {["No monthly fees", "FDIC Insured", "Free transfers", "24/7 support"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-brand-700">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900">Products designed for every need</h2>
            <p className="mt-4 text-xl text-gray-500">From everyday checking to long-term investments, we have you covered.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.title}
                href={product.href}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:border-brand-200 hover:shadow-card-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <product.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-yellow-700">
                  {product.highlight}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{product.title}</h3>
                <p className="mb-4 text-sm text-gray-500 leading-relaxed">{product.description}</p>
                <div className="flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-gray-900">Why choose NorthVault Bank?</h2>
              <p className="mb-8 text-lg text-gray-500 leading-relaxed">
                We combine decades of banking expertise with cutting-edge technology to deliver an experience that's secure, simple, and built around your financial goals.
              </p>
              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  Get Started Today <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bank-card">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">NorthVault Bank</p>
                      <p className="mt-1 text-sm font-medium text-blue-100">Platinum Checking</p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-300" />
                  </div>
                  <div className="mt-8">
                    <p className="text-sm text-blue-200">Card Number</p>
                    <p className="mt-1 text-xl font-semibold tracking-widest">**** **** **** 4821</p>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-blue-200">Cardholder</p>
                      <p className="mt-1 font-semibold tracking-wide">JOHN M. CARTER</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-200">Expires</p>
                      <p className="mt-1 font-medium">09/28</p>
                    </div>
                    <div className="flex">
                      <div className="h-10 w-10 rounded-full bg-red-500 opacity-80" />
                      <div className="-ml-4 h-10 w-10 rounded-full bg-yellow-400 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Available Balance</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">$12,450.00</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+$324 this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white">Ready to take control of your finances?</h2>
          <p className="mt-4 text-xl text-blue-200">Join over 2 million customers who trust NorthVault with their financial future.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 hover:bg-gray-100 transition-colors sm:w-auto"
            >
              Open Your Account
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/40 bg-transparent px-6 py-3 text-base font-medium text-white hover:bg-white/10 transition-colors sm:w-auto"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
