"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Plus, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge, getLoanStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Loan {
  id: string;
  loanType: string;
  requestedCents: number;
  approvedCents: number | null;
  interestRate: number | null;
  termMonths: number;
  monthlyPayCents: number | null;
  status: string;
  purpose: string | null;
  adminNote: string | null;
  createdAt: string;
}

const LOAN_TYPES = [
  { value: "PERSONAL", label: "Personal Loan" },
  { value: "AUTO", label: "Auto Loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "STUDENT", label: "Student Loan" },
  { value: "BUSINESS", label: "Business Loan" },
  { value: "LINE_OF_CREDIT", label: "Line of Credit" },
];

const TERM_OPTIONS = [
  { value: "12", label: "12 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
  { value: "48", label: "48 months" },
  { value: "60", label: "60 months" },
  { value: "84", label: "84 months" },
  { value: "120", label: "120 months" },
];

export default function LoansPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ loanType: "", requestedAmount: "", termMonths: "36", purpose: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/loans")
      .then((r) => r.json())
      .then((d) => setLoans(d.loans || []))
      .finally(() => setLoading(false));
  }, []);

  const estimatedPayment = () => {
    const amount = parseFloat(form.requestedAmount);
    const months = parseInt(form.termMonths);
    if (!amount || !months) return null;
    const rate = 7.99 / 100 / 12;
    const payment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return isNaN(payment) ? null : payment;
  };

  const handleApply = async () => {
    const errs: Record<string, string> = {};
    if (!form.loanType) errs.loanType = "Select a loan type";
    if (!form.requestedAmount) errs.requestedAmount = "Enter an amount";
    else {
      const n = parseFloat(form.requestedAmount);
      if (isNaN(n) || n < 1000) errs.requestedAmount = "Minimum loan amount is $1,000";
      if (n > 500000) errs.requestedAmount = "Maximum loan amount is $500,000";
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, termMonths: parseInt(form.termMonths) }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Application failed", description: data.error }); return; }
      setLoans((p) => [data.loan, ...p]);
      setShowApply(false);
      setForm({ loanType: "", requestedAmount: "", termMonths: "36", purpose: "" });
      toast({ type: "success", title: "Application submitted", description: "We'll review your application shortly." });
    } catch {
      toast({ type: "error", title: "Application failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const ep = estimatedPayment();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="mt-1 text-sm text-gray-500">Your loan applications and active loans.</p>
        </div>
        <Button onClick={() => setShowApply(true)}>
          <Plus className="h-4 w-4" /> Apply for Loan
        </Button>
      </div>

      {/* Loan Products Info */}
      {loans.length === 0 && !loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[{ type: "Personal Loan", rate: "7.99%", range: "$1K–$50K" }, { type: "Auto Loan", rate: "5.49%", range: "$5K–$100K" }, { type: "Mortgage", rate: "6.25%", range: "Up to $2M" }].map((l) => (
            <div key={l.type} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
              <Landmark className="mb-3 h-6 w-6 text-brand-600" />
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">{l.type}</div>
              <div className="mt-1 text-2xl font-bold text-brand-700">From {l.rate}</div>
              <div className="mt-0.5 text-xs text-gray-500">{l.range}</div>
            </div>
          ))}
        </div>
      )}

      {/* Applications */}
      {loans.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Your Applications</CardTitle></CardHeader>
          <CardContent>
            <div className="-mx-6 overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Requested</th>
                    <th className="hidden sm:table-cell">Approved</th>
                    <th className="hidden md:table-cell">Term</th>
                    <th className="hidden lg:table-cell">Monthly</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.id}>
                      <td><span className="text-sm font-medium text-gray-900">{loan.loanType.replace("_", " ")}</span></td>
                      <td><span className="text-sm">{formatCurrency(loan.requestedCents)}</span></td>
                      <td className="hidden sm:table-cell"><span className="text-sm">{loan.approvedCents ? formatCurrency(loan.approvedCents) : "—"}</span></td>
                      <td className="hidden md:table-cell"><span className="text-sm">{loan.termMonths} mo.</span></td>
                      <td className="hidden lg:table-cell"><span className="text-sm">{loan.monthlyPayCents ? formatCurrency(loan.monthlyPayCents) : "—"}</span></td>
                      <td><Badge variant={getLoanStatusVariant(loan.status)} dot>{loan.status}</Badge></td>
                      <td className="hidden md:table-cell"><span className="text-sm text-gray-500">{formatDate(loan.createdAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Modal */}
      <Modal open={showApply} onOpenChange={setShowApply} title="Loan Application" description="Tell us about the loan you need.">
        <div className="space-y-4">
          <Select label="Loan Type" options={LOAN_TYPES} placeholder="Select loan type" value={form.loanType} onChange={(e) => { setForm((p) => ({ ...p, loanType: e.target.value })); setErrors((p) => ({ ...p, loanType: "" })); }} error={errors.loanType} required />
          <Input label="Requested Amount" type="number" placeholder="10000" min="1000" value={form.requestedAmount} onChange={(e) => { setForm((p) => ({ ...p, requestedAmount: e.target.value })); setErrors((p) => ({ ...p, requestedAmount: "" })); }} error={errors.requestedAmount} leftIcon={<span className="text-sm text-gray-400">$</span>} required />
          <Select label="Loan Term" options={TERM_OPTIONS} value={form.termMonths} onChange={(e) => setForm((p) => ({ ...p, termMonths: e.target.value }))} />
          {ep && (
            <div className="rounded-lg bg-brand-50 p-3 text-center">
              <p className="text-xs text-brand-600">Estimated Monthly Payment</p>
              <p className="mt-0.5 text-xl font-bold text-brand-700">{formatCurrency(Math.round(ep * 100))}</p>
              <p className="text-xs text-brand-400">Based on 7.99% APR (rate subject to credit approval)</p>
            </div>
          )}
          <Input label="Purpose (optional)" placeholder="What will you use the loan for?" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowApply(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleApply} loading={submitting} className="flex-1">Submit Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
