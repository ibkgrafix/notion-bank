"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge, getTransactionStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/utils";

interface Biller { id: string; name: string; accountRef: string; category: string; }
interface Account { id: string; accountType: string; accountNumber: string; availableCents: number; status: string; }
interface Transaction { id: string; description: string | null; amountCents: number; status: string; createdAt: string; type: string; }

const BILLER_CATEGORIES = [
  { value: "UTILITIES", label: "Utilities" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "TELECOM", label: "Telecom / Internet" },
  { value: "RENT", label: "Rent / Mortgage" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "OTHER", label: "Other" },
];

export default function PaymentsPage() {
  const { toast } = useToast();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBiller, setShowAddBiller] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [bForm, setBForm] = useState({ name: "", accountRef: "", category: "OTHER" });
  const [bErrors, setBErrors] = useState<Record<string, string>>({});
  const [pForm, setPForm] = useState({ billerId: "", sourceAccountId: "", amount: "", description: "" });
  const [pErrors, setPErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([fetch("/api/billers"), fetch("/api/accounts"), fetch("/api/transactions?limit=10")])
      .then((rs) => Promise.all(rs.map((r) => r.json())))
      .then(([bData, aData, tData]) => {
        setBillers(bData.billers || []);
        setAccounts(aData.accounts || []);
        setTransactions((tData.transactions || []).filter((t: Transaction) => t.type === "PAYMENT"));
      }).finally(() => setLoading(false));
  }, []);

  const handleAddBiller = async () => {
    const errs: Record<string, string> = {};
    if (!bForm.name.trim()) errs.name = "Biller name is required";
    if (!bForm.accountRef.trim()) errs.accountRef = "Account reference is required";
    if (Object.keys(errs).length > 0) { setBErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/billers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bForm) });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Failed", description: data.error }); return; }
      setBillers((p) => [data.biller, ...p]);
      setShowAddBiller(false);
      setBForm({ name: "", accountRef: "", category: "OTHER" });
      toast({ type: "success", title: "Biller added" });
    } catch { toast({ type: "error", title: "Failed to add biller" }); }
    finally { setSubmitting(false); }
  };

  const handlePayment = async () => {
    const errs: Record<string, string> = {};
    if (!pForm.billerId) errs.billerId = "Select a biller";
    if (!pForm.sourceAccountId) errs.sourceAccountId = "Select an account";
    if (!pForm.amount) errs.amount = "Enter amount";
    else { const n = parseFloat(pForm.amount); if (isNaN(n) || n <= 0) errs.amount = "Invalid amount"; }
    if (Object.keys(errs).length > 0) { setPErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pForm) });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Payment failed", description: data.error }); return; }
      setShowPay(false);
      setPForm({ billerId: "", sourceAccountId: "", amount: "", description: "" });
      toast({ type: "success", title: "Payment submitted", description: "Your payment is pending review." });
    } catch { toast({ type: "error", title: "Payment failed" }); }
    finally { setSubmitting(false); }
  };

  const billerOptions = billers.map((b) => ({ value: b.id, label: `${b.name} (${b.accountRef})` }));
  const accountOptions = accounts.filter((a) => a.status === "ACTIVE").map((a) => ({ value: a.id, label: `${a.accountType} — ${maskAccountNumber(a.accountNumber)} (${formatCurrency(a.availableCents)} avail.)` }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Bill Pay</h1><p className="mt-1 text-sm text-gray-500">Pay your bills from your NorthVault accounts.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddBiller(true)}><Plus className="h-4 w-4" /> Add Biller</Button>
          {billers.length > 0 && <Button size="sm" onClick={() => setShowPay(true)}><Receipt className="h-4 w-4" /> Pay Bill</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Saved Billers</CardTitle></CardHeader>
          <CardContent>
            {billers.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Building2 className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No billers added yet.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddBiller(true)}><Plus className="h-4 w-4" /> Add Biller</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {billers.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div><p className="text-sm font-medium text-gray-900">{b.name}</p><p className="text-xs text-gray-400">Ref: {b.accountRef} · {b.category}</p></div>
                    <Button size="sm" variant="outline" onClick={() => { setPForm((p) => ({ ...p, billerId: b.id })); setShowPay(true); }}>Pay</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div><p className="text-sm font-medium text-gray-900">{tx.description || "Bill Payment"}</p><p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold">-{formatCurrency(tx.amountCents)}</p><Badge variant={getTransactionStatusVariant(tx.status)} className="text-xs">{tx.status}</Badge></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={showAddBiller} onOpenChange={setShowAddBiller} title="Add Biller">
        <div className="space-y-4">
          <Input label="Biller Name" placeholder="Electric Company" value={bForm.name} onChange={(e) => setBForm((p) => ({ ...p, name: e.target.value }))} error={bErrors.name} required />
          <Input label="Account Reference" placeholder="Your account number with this biller" value={bForm.accountRef} onChange={(e) => setBForm((p) => ({ ...p, accountRef: e.target.value }))} error={bErrors.accountRef} required />
          <Select label="Category" options={BILLER_CATEGORIES} value={bForm.category} onChange={(e) => setBForm((p) => ({ ...p, category: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddBiller(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddBiller} loading={submitting} className="flex-1">Add Biller</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showPay} onOpenChange={setShowPay} title="Pay Bill">
        <div className="space-y-4">
          <Select label="Biller" options={billerOptions} placeholder="Select biller" value={pForm.billerId} onChange={(e) => { setPForm((p) => ({ ...p, billerId: e.target.value })); setPErrors((p) => ({ ...p, billerId: "" })); }} error={pErrors.billerId} required />
          <Select label="From Account" options={accountOptions} placeholder="Select account" value={pForm.sourceAccountId} onChange={(e) => { setPForm((p) => ({ ...p, sourceAccountId: e.target.value })); setPErrors((p) => ({ ...p, sourceAccountId: "" })); }} error={pErrors.sourceAccountId} required />
          <Input label="Amount" type="number" placeholder="0.00" value={pForm.amount} onChange={(e) => { setPForm((p) => ({ ...p, amount: e.target.value })); setPErrors((p) => ({ ...p, amount: "" })); }} error={pErrors.amount} leftIcon={<span className="text-sm text-gray-400">$</span>} required />
          <Input label="Description (optional)" placeholder="Note for this payment" value={pForm.description} onChange={(e) => setPForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowPay(false)} className="flex-1">Cancel</Button>
            <Button onClick={handlePayment} loading={submitting} className="flex-1">Submit Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
