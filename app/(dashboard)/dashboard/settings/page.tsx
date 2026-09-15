import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Monitor, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true, lastName: true, email: true, phone: true,
      addressLine1: true, city: true, state: true, zipCode: true,
      createdAt: true, lastLoginAt: true,
      sessions: {
        where: { invalidatedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastActiveAt: true },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Account Settings</h1><p className="mt-1 text-sm text-gray-500">Manage your profile and security settings.</p></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Your account details on file.</CardDescription></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: "Full Name", value: `${user.firstName} ${user.lastName}` },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone || "Not provided" },
                { label: "Address", value: user.addressLine1 || "Not provided" },
                { label: "City / State", value: user.city && user.state ? `${user.city}, ${user.state} ${user.zipCode || ""}` : "Not provided" },
                { label: "Member Since", value: formatDate(user.createdAt) },
                { label: "Last Login", value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "N/A" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                  <dt className="text-sm text-gray-500 min-w-24">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Active sessions and login activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-green-50 p-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Account secured</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Active Sessions</p>
            <div className="space-y-3">
              {user.sessions.map((s, i) => (
                <div key={s.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                  <Monitor className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.userAgent?.split(" ")[0] || "Browser"}</p>
                      {i === 0 && <Badge variant="success" className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">IP: {s.ipAddress || "Unknown"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(s.lastActiveAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              To change your password, use the <a href="/forgot-password" className="text-brand-600 hover:underline">Forgot Password</a> flow or contact support at 1-800-NVAULT-1.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
