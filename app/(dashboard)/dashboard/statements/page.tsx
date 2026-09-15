"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, maskAccountNumber, ROUTING_NUMBER } from "@/lib/utils";

interface Account { id: string; accountType: string; accountNumber: string; balanceCents: number; }
interface Transaction {
  id: string; reference: string; type: string; amountCents: number; description: string | null;
  status: string; createdAt: string; beneficiary: { name: string } | null;
}

export default function StatementsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.json()).then((d) => {
      setAccounts(d.accounts || []);
      if (d.accounts?.length > 0) setSelectedAccount(d.accounts[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setTxLoading(true);
    fetch(`/api/transactions?accountId=${selectedAccount}&limit=50`)
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .finally(() => setTxLoading(false));
  }, [selectedAccount]);

  const account = accounts.find((a) => a.id === selectedAccount);

  const printStatement = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const income = transactions.filter((t) => ["DEPOSIT","REFUND"].includes(t.type) && t.status === "COMPLETED").reduce((s, t) => s + t.amountCents, 0);
    const expenses = transactions.filter((t) => !["DEPOSIT","REFUND"].includes(t.type) && t.status === "COMPLETED").reduce((s, t) => s + t.amountCents, 0);

    win.document.write(`<html><head><title>NorthVault Bank Statement</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{color:#1B3A6B}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f9fafb;font-size:12px;text-transform:uppercase}</style></head><body>
    <h1>NorthVault Bank</h1>
    <p style="color:#666">100 NorthVault Plaza, New York, NY 10001 | Routing: ${ROUTING_NUMBER}</p>
    <hr/><h2>Account Statement</h2>
    <p><strong>Account:</strong> ${account?.accountType} — ${maskAccountNumber(account?.accountNumber || "")}</p>
    <p><strong>Current Balance:</strong> ${formatCurrency(account?.balanceCents || 0)}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
    <br/><table><thead><tr><th>Date</th><th>Description</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    ${transactions.map((tx) => `<tr><td>${formatDate(tx.createdAt)}</td><td>${tx.description||tx.beneficiary?.name||tx.type}</td><td>${tx.reference.slice(-8)}</td><td>${["DEPOSIT","REFUND"].includes(tx.type)?"+":"-"}${formatCurrency(tx.amountCents)}</td><td>${tx.status}</td></tr>`).join("")}
    </tbody></table>
    <br/><p><strong>Total Credits:</strong> ${formatCurrency(income)} &nbsp;&nbsp; <strong>Total Debits:</strong> ${formatCurrency(expenses)}</p>
    <br/><p style="font-size:11px;color:#999">This is a fictional statement for demonstration purposes only. NorthVault Bank is not a real financial institution.</p>
    </body></html>`);
    win.document.close();
    win.print();
  };

  const accountOptions = accounts.map((a) => ({ value: a.id, label: `${a.accountType} — ${maskAccountNumber(a.accountNumber)}` }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statements</h1>
        <p className="mt-1 text-sm text-gray-500">View and download your account statements.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Account Statement</CardTitle>
            <div className="flex items-center gap-3">
              <Select options={accountOptions} value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-56" />
              <Button variant="outline" size="sm" onClick={printStatement} disabled={transactions.length === 0}>
                <Download className="h-4 w-4" /> Print / Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {account && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3 rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-xs text-gray-400">Account</p>
                <p className="text-sm font-semibold text-gray-900">{account.accountType}</p>
                <p className="text-xs text-gray-500">{maskAccountNumber(account.accountNumber)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Current Balance</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(account.balanceCents)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Routing Number</p>
                <p className="text-sm font-mono font-medium text-gray-700">{ROUTING_NUMBER}</p>
              </div>
            </div>
          )}

          {txLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" /></div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No transactions for this account yet.</p>
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Description</th><th className="hidden md:table-cell">Reference</th><th>Amount</th><th className="hidden sm:table-cell">Status</th></tr></thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-sm text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="max-w-[200px]"><p className="truncate text-sm text-gray-900">{tx.description||tx.beneficiary?.name||tx.type}</p></td>
                      <td className="hidden md:table-cell"><span className="font-mono text-xs text-gray-400">{tx.reference.slice(-8)}</span></td>
                      <td><span className={`text-sm font-semibold ${["DEPOSIT","REFUND"].includes(tx.type)?"text-green-600":"text-gray-900"}`}>{["DEPOSIT","REFUND"].includes(tx.type)?"+":"-"}{formatCurrency(tx.amountCents)}</span></td>
                      <td className="hidden sm:table-cell"><span className={`text-xs font-medium ${tx.status==="COMPLETED"?"text-green-600":tx.status==="PENDING"?"text-amber-600":"text-red-600"}`}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
