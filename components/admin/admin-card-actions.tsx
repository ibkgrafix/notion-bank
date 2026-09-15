"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/modal";

interface Props { cardId: string; status: string; }

export function AdminCardActions({ cardId, status }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Action failed", description: data.error }); return; }
      toast({ type: "success", title: data.message });
      setConfirm(null);
      router.refresh();
    } catch { toast({ type: "error", title: "Action failed" }); }
    finally { setLoading(false); }
  };

  const buttons = [];
  if (status === "ACTIVE") buttons.push({ label: "Freeze", action: "freeze", color: "text-amber-600 hover:bg-amber-50" });
  if (status === "FROZEN") buttons.push({ label: "Unfreeze", action: "unfreeze", color: "text-green-600 hover:bg-green-50" });
  if (status !== "BLOCKED") buttons.push({ label: "Block", action: "block", color: "text-red-600 hover:bg-red-50" });

  if (buttons.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <>
      <div className="flex gap-1">
        {buttons.map(({ label, action, color }) => (
          <button key={action} onClick={() => setConfirm(action)} className={`rounded px-2 py-1 text-xs font-medium transition-colors ${color}`}>
            {label}
          </button>
        ))}
      </div>
      <ConfirmModal
        open={!!confirm}
        onOpenChange={() => setConfirm(null)}
        title={`${confirm ? confirm.charAt(0).toUpperCase() + confirm.slice(1) : ""} Card`}
        description={`Are you sure you want to ${confirm} this card? The cardholder will be notified.`}
        confirmLabel={`${confirm ? confirm.charAt(0).toUpperCase() + confirm.slice(1) : ""} Card`}
        variant={confirm === "block" ? "danger" : "primary"}
        onConfirm={() => confirm && doAction(confirm)}
        loading={loading}
      />
    </>
  );
}
