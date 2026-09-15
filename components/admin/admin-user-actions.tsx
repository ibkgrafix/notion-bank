"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Unlock, Lock, RefreshCw, Bell, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface Account { id: string; accountType: string; accountNumber: string; status: string; }

interface Props {
  user: { id: string; status: string; accounts: Account[] };
}

export function AdminUserActions({ user }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; accountId?: string; label: string; desc: string; variant: "primary" | "danger" } | null>(null);
  const [notifModal, setNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "" });

  const doAction = async (action: string, extra?: Record<string, string>) => {
    // Use a stable loading key: combine action + optional accountId
    const loadingKey = extra?.accountId ? `${action}_${extra.accountId}` : action;
    setLoading(loadingKey);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Action failed", description: data.error }); return; }
      toast({ type: "success", title: data.message || "Action completed" });
      router.refresh();
    } catch {
      toast({ type: "error", title: "Action failed" });
    } finally {
      setLoading(null);
      setConfirm(null);
    }
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return;
    setLoading("notification");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_notification", ...notifForm }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Failed", description: data.error }); return; }
      toast({ type: "success", title: "Notification sent" });
      setNotifModal(false);
      setNotifForm({ title: "", message: "" });
    } catch {
      toast({ type: "error", title: "Failed to send notification" });
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      label: user.status === "ACTIVE" ? "Suspend Account" : "Activate Account",
      icon: user.status === "ACTIVE" ? UserX : UserCheck,
      onClick: () => setConfirm({
        action: user.status === "ACTIVE" ? "suspend_user" : "activate_user",
        label: user.status === "ACTIVE" ? "Suspend Account" : "Activate Account",
        desc: user.status === "ACTIVE"
          ? "This will prevent the customer from logging in."
          : "This will restore the customer's access.",
        variant: user.status === "ACTIVE" ? "danger" : "primary",
      }),
      variant: (user.status === "ACTIVE" ? "danger" : "primary") as "primary" | "danger",
    },
    {
      label: "Initiate Password Reset",
      icon: RefreshCw,
      onClick: () => setConfirm({ action: "initiate_password_reset", label: "Initiate Password Reset", desc: "This will send a password reset link to the customer.", variant: "primary" }),
      variant: "outline" as const,
    },
    {
      label: "Send Notification",
      icon: Bell,
      onClick: () => setNotifModal(true),
      variant: "outline" as const,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Administrative Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* Account freeze/unfreeze */}
          {user.accounts.map((account) => (
            <div key={account.id} className="rounded-lg border border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{account.accountType}</p>
              {account.status === "ACTIVE" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  loading={loading === `freeze_account_${account.id}`}
                  onClick={() => setConfirm({
                    action: "freeze_account",
                    accountId: account.id,
                    label: "Freeze Account",
                    desc: `This will freeze the ${account.accountType} account and notify the customer.`,
                    variant: "danger",
                  })}
                >
                  <Lock className="h-3.5 w-3.5" /> Freeze Account
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  loading={loading === `unfreeze_account_${account.id}`}
                  onClick={() => setConfirm({
                    action: "unfreeze_account",
                    accountId: account.id,
                    label: "Unfreeze Account",
                    desc: `This will unfreeze the ${account.accountType} account and restore access.`,
                    variant: "primary",
                  })}
                >
                  <Unlock className="h-3.5 w-3.5" /> Unfreeze Account
                </Button>
              )}
            </div>
          ))}

          {/* Other actions */}
          {actions.map(({ label, icon: Icon, onClick, variant }) => (
            <Button
              key={label}
              variant={variant === "danger" ? "danger" : "outline"}
              size="sm"
              className="w-full"
              onClick={onClick}
              loading={loading === label}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <ConfirmModal
        open={!!confirm}
        onOpenChange={() => setConfirm(null)}
        title={confirm?.label || ""}
        description={confirm?.desc || ""}
        confirmLabel={confirm?.label || "Confirm"}
        variant={confirm?.variant || "primary"}
        onConfirm={() => confirm && doAction(confirm.action, confirm.accountId ? { accountId: confirm.accountId } : undefined)}
        loading={!!loading}
      />

      <Modal open={notifModal} onOpenChange={setNotifModal} title="Send Notification" description="Send a message to this customer.">
        <div className="space-y-4">
          <Input label="Title" placeholder="Important account update" value={notifForm.title} onChange={(e) => setNotifForm((p) => ({ ...p, title: e.target.value }))} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={notifForm.message}
              onChange={(e) => setNotifForm((p) => ({ ...p, message: e.target.value }))}
              rows={4}
              placeholder="Message content..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setNotifModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSendNotification} loading={loading === "notification"} className="flex-1">Send</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
