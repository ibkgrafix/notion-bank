"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Snowflake, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { Badge, getCardStatusVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { maskAccountNumber } from "@/lib/utils";
import { SkeletonCard } from "@/components/ui/loading-skeleton";

interface CardData {
  id: string;
  cardType: string;
  lastFour: string;
  cardholderName: string;
  expirationMonth: number;
  expirationYear: number;
  status: string;
  networkBrand: string;
  account: { accountType: string; accountNumber: string };
}

export default function CardsPage() {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCard, setConfirmCard] = useState<{ id: string; action: "freeze" | "unfreeze" } | null>(null);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .catch(() => toast({ type: "error", title: "Failed to load cards" }))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async () => {
    if (!confirmCard) return;
    setActionLoading(confirmCard.id);
    try {
      const res = await fetch(`/api/cards/${confirmCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmCard.action }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ type: "error", title: "Action failed", description: data.error }); return; }
      setCards((prev) => prev.map((c) => c.id === confirmCard.id ? { ...c, status: confirmCard.action === "freeze" ? "FROZEN" : "ACTIVE" } : c));
      toast({ type: "success", title: confirmCard.action === "freeze" ? "Card frozen" : "Card unfrozen" });
    } catch {
      toast({ type: "error", title: "Action failed" });
    } finally {
      setActionLoading(null);
      setConfirmCard(null);
    }
  };

  const expiry = (m: number, y: number) => `${String(m).padStart(2, "0")}/${String(y).slice(-2)}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Cards</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your debit and credit cards.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No cards found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className={`bank-card ${card.status === "FROZEN" ? "opacity-75" : ""}`}>
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">NorthVault Bank</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{card.account.accountType} {card.cardType}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getCardStatusVariant(card.status)}>
                      {card.status}
                    </Badge>
                    <p className="text-xs font-medium text-blue-200">{card.networkBrand}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-xs text-blue-300">Card Number</p>
                  <p className="mt-0.5 text-lg font-semibold tracking-widest text-white">
                    **** **** **** {card.lastFour}
                  </p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-blue-300">Cardholder</p>
                    <p className="mt-0.5 text-sm font-semibold tracking-wide text-white">{card.cardholderName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-300">Expires</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{expiry(card.expirationMonth, card.expirationYear)}</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-4 border-t border-white/10 pt-4">
                <p className="mb-3 text-xs text-blue-300">
                  Linked to: {card.account.accountType} {maskAccountNumber(card.account.accountNumber)}
                </p>
                {card.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs"
                    onClick={() => setConfirmCard({ id: card.id, action: "freeze" })}
                  >
                    <Snowflake className="h-3.5 w-3.5" /> Freeze Card
                  </Button>
                )}
                {card.status === "FROZEN" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs"
                    onClick={() => setConfirmCard({ id: card.id, action: "unfreeze" })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Unfreeze Card
                  </Button>
                )}
                {(card.status === "BLOCKED" || card.status === "EXPIRED") && (
                  <p className="text-xs text-red-300">Contact support for assistance with this card.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmCard}
        onOpenChange={() => setConfirmCard(null)}
        title={confirmCard?.action === "freeze" ? "Freeze Card" : "Unfreeze Card"}
        description={
          confirmCard?.action === "freeze"
            ? "Freezing your card will prevent all new transactions. You can unfreeze it at any time."
            : "Unfreezing your card will allow transactions to resume immediately."
        }
        confirmLabel={confirmCard?.action === "freeze" ? "Freeze Card" : "Unfreeze Card"}
        variant={confirmCard?.action === "freeze" ? "danger" : "primary"}
        onConfirm={handleAction}
        loading={!!actionLoading}
      />
    </div>
  );
}
