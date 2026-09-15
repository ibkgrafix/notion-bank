"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, ArrowLeftRight, CreditCard, Landmark, Shield, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatTimeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  TRANSFER: <ArrowLeftRight className="h-4 w-4" />,
  TRANSACTION: <ArrowLeftRight className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  LOAN: <Landmark className="h-4 w-4" />,
  SECURITY: <Shield className="h-4 w-4" />,
  ACCOUNT: <Settings className="h-4 w-4" />,
  SYSTEM: <Info className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  TRANSFER: "bg-blue-50 text-blue-600",
  TRANSACTION: "bg-blue-50 text-blue-600",
  CARD: "bg-purple-50 text-purple-600",
  LOAN: "bg-green-50 text-green-600",
  SECURITY: "bg-red-50 text-red-600",
  ACCOUNT: "bg-amber-50 text-amber-600",
  SYSTEM: "bg-gray-100 text-gray-600",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      toast({ type: "error", title: "Failed to mark notifications" });
    } finally {
      setMarking(false);
    }
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id] }),
    });
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((p) => Math.max(0, p - 1));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} loading={marking}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-lg p-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded bg-gray-200 w-48" />
                    <div className="h-3 animate-pulse rounded bg-gray-100 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No notifications</p>
              <p className="mt-1 text-xs text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markRead(notif.id)}
                  className={cn(
                    "flex gap-3 px-2 py-4 transition-colors",
                    !notif.read && "cursor-pointer hover:bg-gray-50",
                    !notif.read && "bg-blue-50/30"
                  )}
                >
                  <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full", typeColors[notif.type] || "bg-gray-100 text-gray-600")}>
                    {typeIcons[notif.type] || <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium", notif.read ? "text-gray-700" : "text-gray-900")}>
                        {notif.title}
                        {!notif.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500" />}
                      </p>
                      <span className="flex-shrink-0 text-xs text-gray-400">{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
