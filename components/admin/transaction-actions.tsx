"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Props {
  transactionId: string;
}

export function TransactionActions({ transactionId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [showApprove, setShowApprove] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Approval failed", description: data.error }); return; }
      toast({ type: "success", title: "Transaction approved", description: "The transaction has been approved and completed." });
      setShowApprove(false);
      router.refresh();
    } catch {
      toast({ type: "error", title: "Approval failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Decline failed", description: data.error }); return; }
      toast({ type: "success", title: "Transaction declined" });
      setShowDecline(false);
      setAdminNote("");
      router.refresh();
    } catch {
      toast({ type: "error", title: "Decline failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowApprove(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Approve"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowDecline(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          title="Decline"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        open={showApprove}
        onOpenChange={setShowApprove}
        title="Approve Transaction"
        description="This will approve the transaction and deduct the funds from the customer's account. This action cannot be undone."
        confirmLabel="Approve Transaction"
        variant="primary"
        onConfirm={handleApprove}
        loading={loading}
      />

      <Modal open={showDecline} onOpenChange={setShowDecline} title="Decline Transaction" description="Provide an optional reason for declining this transaction.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason (optional)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Suspicious activity, insufficient information, policy violation..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <p className="text-xs text-gray-500">The customer will be notified and any held funds will be released.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDecline(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDecline} loading={loading} className="flex-1">Decline Transaction</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
