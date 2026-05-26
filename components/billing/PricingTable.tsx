"use client";

import { useState } from "react";
import type { PLANS } from "@/lib/stripe";

interface PricingTableProps {
  tenantSlug: string;
  currentPlan: string;
  plans: typeof PLANS;
}

export function PricingTable({ tenantSlug, currentPlan, plans }: PricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch(`/api/${tenantSlug}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du paiement");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(null);
    }
  }

  const upgradeable = Object.entries(plans).filter(([key]) => key !== "free" && key !== currentPlan);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-bold mb-4">Passer au niveau supérieur</h2>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {upgradeable.map(([key, plan]) => (
          <div
            key={key}
            className={`rounded-xl border-2 p-5 ${
              key === "pro" ? "border-blue-600 bg-blue-50" : "border-gray-200"
            }`}
          >
            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
            <p className="text-2xl font-bold mb-3">
              €{plan.priceMonthly}
              <span className="text-sm text-gray-400 font-normal">/mois</span>
            </p>
            <button
              onClick={() => handleUpgrade(key)}
              disabled={loading !== null}
              className={`w-full py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                key === "pro"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {loading === key ? "Redirection…" : `Passer au ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
