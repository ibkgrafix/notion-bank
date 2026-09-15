import Link from "next/link";
import { Shield, Phone, Mail, MapPin } from "lucide-react";

const footerLinks = {
  Personal: [
    { label: "Checking Accounts", href: "/checking" },
    { label: "Savings Accounts", href: "/savings" },
    { label: "Credit Cards", href: "/cards" },
    { label: "Personal Loans", href: "/loans" },
    { label: "Mortgages", href: "/mortgages" },
  ],
  Business: [
    { label: "Business Banking", href: "/business-banking" },
    { label: "Business Accounts", href: "/business-banking" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/about" },
    { label: "Security", href: "/security" },
  ],
  Help: [
    { label: "Help Center", href: "/help" },
    { label: "FAQs", href: "/help" },
    { label: "Privacy Policy", href: "/help" },
    { label: "Terms of Service", href: "/help" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold text-white">NorthVault</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
                  Bank
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              A fictional U.S.-style financial institution built to demonstrate modern digital banking capabilities.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>1-800-NVAULT-1</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@northvaultbank.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>100 NorthVault Plaza, New York, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} NorthVault Bank. All rights reserved. Member FDIC. Equal Housing Lender.
            </p>
            <p className="text-xs text-gray-600">
              This is a fictional banking application. All accounts and transactions are simulated.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
