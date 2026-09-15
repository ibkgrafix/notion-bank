"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge, getTransactionStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/utils";
import { SkeletonTable } from "@/components/ui/loading-skeleton";

interface Account {
  id: string;
  accountType: string;
  accountNumber: string;
  availableCents: number;
  balanceCents: number;
  status: string;
}

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  nickname: string | null;
}

interface Transaction {
  id: string;
  reference: string;
  type: string;
  amountCents: number;
  description: string | null;
  status: string;
  createdAt: string;
  beneficiary: { name: string } | null;
  account: { accountType: string };
}

export default function TransfersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sourceAccountId: "",
    beneficiaryId: "",
    amount: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "review" | "success">("form");

  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [bForm, setBForm] = useState({ name: "", accountNumber: "", routingNumber: "", bankName: "", nickname: "" });
  const [bErrors, setBErrors] = useState<Record<string, string>>({});
  const [addingBeneficiary, setAddingBeneficiary] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, benRes, txRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/beneficiaries"),
        fetch("/api/transactions?limit=10"),
      ]);
      const [accData, benData, txData] = await Promise.all([
        accRes.json(), benRes.json(), txRes.json(),
      ]);
      setAccounts(accData.accounts || []);
      setBeneficiaries(benData.beneficiaries || []);
      setTransactions(txData.transactions || []);
    } catch {
      toast({ type: "error", title: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.sourceAccountId) errs.sourceAccountId = "Select a source account";
    if (!form.beneficiaryId) errs.beneficiaryId = "Select a recipient";
    if (!form.amount) errs.amount = "Enter an amount";
    else {
      const n = parseFloat(form.amount);
      if (isNaN(n) || n <= 0) errs.amount = "Enter a valid amount";
      const acc = accounts.find((a) => a.id === form.sourceAccountId);
      if (acc && n * 100 > acc.availableCents) errs.amount = "Insufficient available balance";
    }
    return errs;
  };

  const handleReview = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep("review");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ type: "error", title: "Transfer failed", description: data.error });
        setStep("form");
        return;
      }
      setStep("success");
      fetchData();
      toast({ type: "success", title: "Transfer submitted", description: "Your transfer is pending review." });
    } catch {
      toast({ type: "error", title: "Transfer failed", description: "Please try again." });
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBeneficiary = async () => {
    const errs: Record<string, string> = {};
    if (!bForm.name) errs.name = "Name is required";
    if (!bForm.accountNumber || !/^\d{8,17}$/.test(bForm.accountNumber)) errs.accountNumber = "Enter a valid account number (8-17 digits)";
    if (!bForm.routingNumber || !/^\d{9}$/.test(bForm.routingNumber)) errs.routingNumber = "Routing number must be 9 digits";
    if (!bForm.bankName) errs.bankName = "Bank name is required";
    if (Object.keys(errs).length > 0) { setBErrors(errs); return; }

    setAddingBeneficiary(true);
    try {
      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ type: "error", title: "Failed to add beneficiary", description: data.error });
        return;
      }
      setBeneficiaries((p) => [data.beneficiary, ...p]);
      setShowAddBeneficiary(false);
      setBForm({ name: "", accountNumber: "", routingNumber: "", bankName: "", nickname: "" });
      toast({ type: "success", title: "Beneficiary added" });
    } catch {
      toast({ type: "error", title: "Failed to add beneficiary" });
    } finally {
      setAddingBeneficiary(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === form.sourceAccountId);
  const selectedBeneficiary = beneficiaries.find((b) => b.id === form.beneficiaryId);

  const accountOptions = accounts
    .filter((a) => a.status === "ACTIVE")
    .map((a) => ({
      value: a.id,
      label: `${a.accountType} — ${maskAccountNumber(a.accountNumber)} (${formatCurrency(a.availableCents)} avail.)`,
    }));

  const beneficiaryOptions = beneficiaries.map((b) => ({
    value: b.id,
    label: b.nickname ? `${b.nickname} (${b.name})` : `${b.name} — ${b.bankName}`,
  }));

  if (step === "success") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <ArrowLeftRight className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Transfer Submitted</h2>
          <p className="mt-2 text-gray-500">Your transfer is pending review and will be processed soon.</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setStep("form"); setForm({ sourceAccountId: "", beneficiaryId: "", amount: "", description: "" }); }}>
              New Transfer
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Review Transfer</h1>
        <Card className="max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">From</span>
                <span className="font-medium text-gray-900">
                  {selectedAccount?.accountType} {maskAccountNumber(selectedAccount?.accountNumber || "")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To</span>
                <span className="font-medium text-gray-900">
                  {selectedBeneficiary?.name} — {selectedBeneficiary?.bankName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(Math.round(parseFloat(form.amount) * 100))}</span>
              </div>
              {form.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Note</span>
                  <span className="text-gray-700">{form.description}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              This transfer will be reviewed by our team before processing. You'll receive a notification once it's approved.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
                Edit
              </Button>
              <Button onClick={handleSubmit} loading={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Confirm Transfer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="mt-1 text-sm text-gray-500">Send money to your saved recipients.</p>
        </div>
        <Button onClick={() => setShowAddBeneficiary(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4" /> Add Recipient
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transfer Form */}
        <Card>
          <CardHeader><CardTitle>New Transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <SkeletonTable rows={3} />
            ) : (
              <>
                <Select
                  label="From Account"
                  options={accountOptions}
                  placeholder="Select account"
                  value={form.sourceAccountId}
                  onChange={(e) => { setForm((p) => ({ ...p, sourceAccountId: e.target.value })); setErrors((p) => ({ ...p, sourceAccountId: "" })); }}
                  error={errors.sourceAccountId}
                  required
                />

                {beneficiaries.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                    <User className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No recipients saved yet.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddBeneficiary(true)}>
                      <Plus className="h-4 w-4" /> Add Recipient
                    </Button>
                  </div>
                ) : (
                  <Select
                    label="To (Recipient)"
                    options={beneficiaryOptions}
                    placeholder="Select recipient"
                    value={form.beneficiaryId}
                    onChange={(e) => { setForm((p) => ({ ...p, beneficiaryId: e.target.value })); setErrors((p) => ({ ...p, beneficiaryId: "" })); }}
                    error={errors.beneficiaryId}
                    required
                  />
                )}

                <Input
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => { setForm((p) => ({ ...p, amount: e.target.value })); setErrors((p) => ({ ...p, amount: "" })); }}
                  error={errors.amount}
                  leftIcon={<span className="text-sm text-gray-400">$</span>}
                  hint={selectedAccount ? `Available: ${formatCurrency(selectedAccount.availableCents)}` : undefined}
                  required
                />

                <Input
                  label="Description (optional)"
                  placeholder="What's this transfer for?"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />

                <Button
                  onClick={handleReview}
                  disabled={beneficiaries.length === 0}
                  className="w-full"
                  size="lg"
                >
                  Review Transfer
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={4} />
            ) : transactions.filter((t) => t.type === "TRANSFER").length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No transfers yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.filter((t) => t.type === "TRANSFER").slice(0, 6).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.beneficiary?.name || tx.description || "Transfer"}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">-{formatCurrency(tx.amountCents)}</p>
                      <Badge variant={getTransactionStatusVariant(tx.status)} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Beneficiary Modal */}
      <Modal
        open={showAddBeneficiary}
        onOpenChange={setShowAddBeneficiary}
        title="Add Recipient"
        description="Add an external account to send money to."
      >
        <div className="space-y-4">
          <Input label="Full Name" placeholder="John Smith" value={bForm.name} onChange={(e) => setBForm((p) => ({ ...p, name: e.target.value }))} error={bErrors.name} required />
          <Input label="Account Number" placeholder="12345678901" value={bForm.accountNumber} onChange={(e) => setBForm((p) => ({ ...p, accountNumber: e.target.value }))} error={bErrors.accountNumber} required />
          <Input label="Routing Number" placeholder="021000021" value={bForm.routingNumber} onChange={(e) => setBForm((p) => ({ ...p, routingNumber: e.target.value }))} error={bErrors.routingNumber} hint="9-digit ABA routing number" required />
          <Input label="Bank Name" placeholder="First National Bank" value={bForm.bankName} onChange={(e) => setBForm((p) => ({ ...p, bankName: e.target.value }))} error={bErrors.bankName} required />
          <Input label="Nickname (optional)" placeholder="My savings account" value={bForm.nickname} onChange={(e) => setBForm((p) => ({ ...p, nickname: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddBeneficiary(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAddBeneficiary} loading={addingBeneficiary} className="flex-1">Add Recipient</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
