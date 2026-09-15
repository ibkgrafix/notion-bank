import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
export const metadata: Metadata = { title: "Help Center" };
const faqs = [
  { q: "How do I open an account?", a: "Click 'Open Account' from the homepage or visit /register. The process takes under 5 minutes and your accounts are available immediately." },
  { q: "How do I reset my password?", a: "Visit the 'Forgot Password' page and enter your email. You'll receive a reset link. For security, links expire after 1 hour." },
  { q: "How long do transfers take?", a: "Transfers are reviewed by our team typically within 1 business day. You'll receive a notification once approved." },
  { q: "Is my money FDIC insured?", a: "Yes. NorthVault Bank deposits are insured up to $250,000 per depositor by the FDIC." },
  { q: "How do I freeze my card?", a: "Log in to your dashboard, navigate to Cards, and click the freeze button. You can unfreeze at any time." },
  { q: "What should I do if I see suspicious activity?", a: "Contact us immediately at 1-800-NVAULT-1. You can also lock your account from the Security settings in your dashboard." },
];
export default function HelpPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-4 text-xl text-gray-500">Find answers to common questions.</p>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="rounded-xl border border-gray-200 bg-white shadow-card group">
              <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-medium text-gray-900 marker:content-none">
                {q}
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-gray-100 px-5 pb-5 pt-3 text-sm text-gray-600 leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
