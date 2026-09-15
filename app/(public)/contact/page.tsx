import { Phone, Mail, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact Us" };
export default function ContactPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-500">We're here to help, 24 hours a day, 7 days a week.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Phone, title: "Phone", info: "1-800-NVAULT-1", sub: "Available 24/7" },
            { icon: Mail, title: "Email", info: "support@northvaultbank.com", sub: "Reply within 24 hours" },
            { icon: MapPin, title: "Headquarters", info: "100 NorthVault Plaza", sub: "New York, NY 10001" },
            { icon: Clock, title: "Branch Hours", info: "Mon–Fri 9am–5pm", sub: "Sat 10am–2pm" },
          ].map(({ icon: Icon, title, info, sub }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
              <p className="text-sm font-medium text-gray-700">{info}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
