"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ArrowLeftRight, Landmark, CreditCard, ClipboardList, LogOut, Shield, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/loans", label: "Loans", icon: Landmark },
  { href: "/admin/cards", label: "Cards", icon: CreditCard },
  { href: "/admin/audit-logs", label: "Audit Log", icon: ClipboardList },
];

interface AdminSidebarProps {
  admin: { firstName: string; lastName: string; email: string };
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      toast({ type: "error", title: "Logout failed" });
    } finally {
      setLoggingOut(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">NorthVault</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Admin Portal</div>
        </div>
      </div>

      <div className="border-b border-gray-800 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{admin.firstName} {admin.lastName}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" style={{ width: "1.125rem", height: "1.125rem" }} />
                  {label}
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-800 p-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50 transition-colors"
        >
          <LogOut style={{ width: "1.125rem", height: "1.125rem" }} />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 flex-shrink-0 bg-gray-900 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-gray-900 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-white" />
          <span className="font-bold text-white">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded p-1.5 text-gray-400 hover:text-white">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-xl lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
