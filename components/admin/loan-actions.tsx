"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

interface Props {
  loanId: string;
  requestedCents: number;
  termMonths: number;
}

export function LoanActions({ loanId, requestedCents, termMonths }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [showApprove, setShowApprove] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [approvedAmount, setApprovedAmount] = useState((requestedCents / 100).toString());
  const [interestRate, setInterestRate] = useState("7.99");
  const [loading, setLoading] = useState(false);

  const doAction = async (action: "approve" | "decline") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote, approvedAmount, interestRate: parseFloat(interestRate), termMonths }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Action failed", description: data.error }); return; }
      toast({ type: "success", title: action === "approve" ? "Loan approved" : "Loan declined" });
      action === "approve" ? setShowApprove(false) : setShowDecline(false);
      setAdminNote("");
      router.refresh();
    } catch {
      toast({ type: "error", title: "Action failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowApprove(true)} className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100" title="Approve"><CheckCircle2 className="h-4 w-4" /></button>
        <button onClick={() => setShowDecline(true)} className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Decline"><XCircle className="h-4 w-4" /></button>
      </div>

      <Modal open={showApprove} onOpenChange={setShowApprove} title="Approve Loan Application">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p>Requested: <strong>{formatCurrency(requestedCents)}</strong> over {termMonths} months</p>
          </div>
          <Input label="Approved Amount ($)" type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
          <Input label="Interest Rate (APR %)" type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Note (optional)</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowApprove(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => doAction("approve")} loading={loading} className="flex-1">Approve Loan</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDecline} onOpenChange={setShowDecline} title="Decline Loan Application">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason (optional)</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} placeholder="Credit score insufficient, debt-to-income ratio too high..." className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDecline(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => doAction("decline")} loading={loading} className="flex-1">Decline Application</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
