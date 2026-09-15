import { Shield, Lock, Eye, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Security" };
export default function SecurityPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16"><h1 className="text-4xl font-bold text-gray-900">Security at NorthVault</h1><p className="mt-4 text-xl text-gray-500">Your security is our highest priority. Here's how we protect you.</p></div>
        <div className="grid gap-6 sm:grid-cols-2">{[{icon:Shield,title:"256-bit SSL Encryption",desc:"All data transmitted between your device and NorthVault is encrypted using industry-standard TLS/SSL."},{icon:Lock,title:"Multi-Factor Authentication",desc:"An additional layer of security ensures only you can access your account."},{icon:Eye,title:"Real-Time Fraud Monitoring",desc:"Our systems monitor transactions 24/7 for suspicious activity."},{icon:AlertTriangle,title:"Account Alerts",desc:"Instant notifications for every transaction, login, and account change."}].map(({icon:Icon,title,desc})=>(
          <div key={title} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></div>
            <div><h3 className="mb-1 font-semibold text-gray-900">{title}</h3><p className="text-sm text-gray-500 leading-relaxed">{desc}</p></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
