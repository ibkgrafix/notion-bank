import type { Metadata } from "next";
export const metadata: Metadata = { title: "About Us" };
export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-4xl font-bold text-gray-900">About NorthVault Bank</h1>
        <div className="prose prose-gray max-w-none">
          <p className="text-xl text-gray-500 leading-relaxed">NorthVault Bank is a modern digital financial institution committed to delivering exceptional banking services with transparency, security, and innovation at its core.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[{title:"Our Mission",text:"To make banking simple, transparent, and accessible for everyone — whether you're just starting out or managing generations of wealth."},{title:"Our Values",text:"Integrity, security, and customer-first thinking guide every decision we make. We believe banking should work for you, not against you."},{title:"Our Promise",text:"We guarantee the security of your funds, the clarity of our fees, and the quality of our customer support, every single day."}].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <p className="text-sm text-gray-500 italic">NorthVault Bank is a fictional financial institution created for demonstration purposes. All accounts, transactions, and financial data are simulated and non-production.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
