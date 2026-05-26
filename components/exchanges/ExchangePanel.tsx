"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Family {
  id: string;
  name: string;
  mamanLabel: string;
  papaLabel: string;
}

interface Exchange {
  id: string;
  familyId: string;
  familyName: string;
  requestedById: string;
  requesterName: string;
  targetDate: string;
  proposedDate: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
}

interface ExchangePanelProps {
  tenantSlug: string;
  families: Family[];
  initialExchanges: Exchange[];
  currentUserId: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ExchangePanel({
  tenantSlug,
  families,
  initialExchanges,
  currentUserId,
}: ExchangePanelProps) {
  const router = useRouter();
  const [exchanges, setExchanges] = useState(initialExchanges);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    familyId: families[0]?.id ?? "",
    targetDate: "",
    proposedDate: "",
    reason: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.familyId || !form.targetDate) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/${tenantSlug}/families/${form.familyId}/exchanges`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetDate: form.targetDate,
            proposedDate: form.proposedDate || undefined,
            reason: form.reason || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }

      setShowForm(false);
      setForm({ familyId: families[0]?.id ?? "", targetDate: "", proposedDate: "", reason: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(exchange: Exchange, status: "accepted" | "declined") {
    setError(null);
    try {
      const res = await fetch(
        `/api/${tenantSlug}/families/${exchange.familyId}/exchanges/${exchange.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }
      setExchanges((prev) => prev.filter((e) => e.id !== exchange.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  const mine = exchanges.filter((e) => e.requestedById === currentUserId);
  const incoming = exchanges.filter((e) => e.requestedById !== currentUserId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New request button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Annuler" : "+ Nouvelle demande"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
        >
          <h2 className="font-bold">Nouvelle demande d&apos;échange</h2>

          {families.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
              <select
                value={form.familyId}
                onChange={(e) => setForm({ ...form, familyId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week-end à échanger *
              </label>
              <input
                type="date"
                required
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week-end proposé en échange
              </label>
              <input
                type="date"
                value={form.proposedDate}
                onChange={(e) => setForm({ ...form, proposedDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif (optionnel)
            </label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="ex: Week-end chargé, voyage prévu…"
              maxLength={500}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Envoi…" : "Envoyer la demande"}
          </button>
        </form>
      )}

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Demandes reçues ({incoming.length})
          </h2>
          <div className="space-y-3">
            {incoming.map((ex) => (
              <div key={ex.id} className="bg-white rounded-2xl border border-blue-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🔄</span>
                      <span className="font-semibold text-sm">{ex.familyName}</span>
                      <span className="text-xs text-gray-400">· de {ex.requesterName}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Demande :</strong> {fmt(ex.targetDate)}
                    </p>
                    {ex.proposedDate && (
                      <p className="text-sm text-gray-700">
                        <strong>Proposé en échange :</strong> {fmt(ex.proposedDate)}
                      </p>
                    )}
                    {ex.reason && (
                      <p className="text-sm text-gray-500 mt-1 italic">&ldquo;{ex.reason}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDecision(ex, "accepted")}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      ✅ Accepter
                    </button>
                    <button
                      onClick={() => handleDecision(ex, "declined")}
                      className="border border-red-200 text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My pending requests */}
      {mine.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Mes demandes en attente ({mine.length})
          </h2>
          <div className="space-y-3">
            {mine.map((ex) => (
              <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-75">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⏳</span>
                  <span className="font-semibold text-sm">{ex.familyName}</span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>Demande :</strong> {fmt(ex.targetDate)}
                </p>
                {ex.proposedDate && (
                  <p className="text-sm text-gray-700">
                    <strong>Proposé :</strong> {fmt(ex.proposedDate)}
                  </p>
                )}
                {ex.reason && (
                  <p className="text-sm text-gray-500 mt-1 italic">&ldquo;{ex.reason}&rdquo;</p>
                )}
                <p className="text-xs text-amber-600 mt-2 font-medium">En attente de réponse</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {exchanges.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">🔄</p>
          <h3 className="font-bold text-gray-900 mb-1">Aucune demande en cours</h3>
          <p className="text-gray-500 text-sm">
            Proposez un échange à l&apos;autre parent en cliquant sur &ldquo;Nouvelle demande&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
