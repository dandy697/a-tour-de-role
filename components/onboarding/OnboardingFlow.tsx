"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateMultipleYears } from "@/lib/generators/weekend-generator";
import type { Agreement } from "@/lib/generators/weekend-generator";
import type { Zone } from "@/lib/holidays/school-holidays";

type Step = "family" | "agreement" | "preview" | "success";

interface FamilyConfig {
  name: string;
  mamanLabel: string;
  papaLabel: string;
  zone: Zone;
}

const ZONE_LABELS: Record<Zone, string> = {
  "zone-a": "Zone A (ex: Bordeaux, Lyon, Toulouse…)",
  "zone-b": "Zone B (ex: Aix-Marseille, Montpellier, Nice…)",
  "zone-c": "Zone C (ex: Créteil, Paris, Versailles…)",
};

const AGREEMENT_LABELS: Record<Agreement, { label: string; desc: string }> = {
  alternance: { label: "Semaines alternées", desc: "Un week-end sur deux, en alternance" },
  papa_impairs: {
    label: "Papa semaines impaires",
    desc: "Papa les semaines impaires, Maman les paires",
  },
  maman_impairs: {
    label: "Maman semaines impaires",
    desc: "Maman les semaines impaires, Papa les paires",
  },
};

export function OnboardingFlow({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("family");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<FamilyConfig>({
    name: "",
    mamanLabel: "Maman",
    papaLabel: "Papa",
    zone: "zone-a",
  });
  const [agreement, setAgreement] = useState<Agreement>("alternance");
  const [preview, setPreview] = useState<ReturnType<typeof generateMultipleYears> | null>(null);

  function handleGenerate() {
    const result = generateMultipleYears(agreement, new Date().getFullYear(), 3, config.zone);
    setPreview(result);
    setStep("preview");
  }

  async function handleCreate() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          agreement,
          weekends: preview.weekends.map((w) => ({
            startDate: w.startDate.toISOString(),
            endDate: w.endDate.toISOString(),
            owner: w.owner,
            type: w.type,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  const standardWeekends = preview?.weekends.filter((w) => w.type === "weekend").length ?? 0;
  const schoolWeekends = preview?.weekends.filter((w) => w.type === "school-holiday").length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b">
        {(["family", "agreement", "preview"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 py-3 text-center text-sm font-medium border-r last:border-r-0 ${
              step === s
                ? "bg-blue-50 text-blue-700"
                : i < ["family", "agreement", "preview", "success"].indexOf(step)
                  ? "text-green-600 bg-green-50"
                  : "text-gray-400"
            }`}
          >
            {i < ["family", "agreement", "preview", "success"].indexOf(step) ? "✓ " : `${i + 1}. `}
            {s === "family" ? "Famille" : s === "agreement" ? "Accord" : "Aperçu"}
          </div>
        ))}
      </div>

      <div className="p-8">
        {/* Step 1: Family config */}
        {step === "family" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">👨‍👩‍👧 Configuration famille</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la famille *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="ex: Famille Martin"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé parent 1
                </label>
                <input
                  type="text"
                  value={config.mamanLabel}
                  onChange={(e) => setConfig({ ...config, mamanLabel: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé parent 2
                </label>
                <input
                  type="text"
                  value={config.papaLabel}
                  onChange={(e) => setConfig({ ...config, papaLabel: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone scolaire
              </label>
              <select
                value={config.zone}
                onChange={(e) => setConfig({ ...config, zone: e.target.value as Zone })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ZONE_LABELS).map(([z, label]) => (
                  <option key={z} value={z}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={!config.name.trim()}
              onClick={() => setStep("agreement")}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}

        {/* Step 2: Agreement */}
        {step === "agreement" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">📅 Accord de garde</h2>
            <p className="text-gray-500 text-sm">
              Comment s&apos;organise la répartition des week-ends ?
            </p>
            <div className="space-y-3">
              {Object.entries(AGREEMENT_LABELS).map(([key, { label, desc }]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    agreement === key
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="agreement"
                    value={key}
                    checked={agreement === key}
                    onChange={() => setAgreement(key as Agreement)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("family")}
                className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Générer le planning →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && preview && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">✅ Aperçu du planning</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{standardWeekends}</p>
                <p className="text-xs text-gray-500 mt-1">Week-ends standard</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{schoolWeekends}</p>
                <p className="text-xs text-gray-500 mt-1">Vacances scolaires</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{preview.alerts.length}</p>
                <p className="text-xs text-gray-500 mt-1">Jours fériés</p>
              </div>
            </div>

            {preview.alerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  ⚠️ Jours fériés détectés — à traiter manuellement :
                </p>
                <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                  {preview.alerts.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("agreement")}
                className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                ← Modifier
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Création en cours…" : "Créer le planning 🎉"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="text-center py-6 space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold">Planning créé !</h2>
            <p className="text-gray-500">
              Ton planning est prêt pour les 3 prochaines années. Tu peux maintenant inviter
              l&apos;autre parent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => router.push(`/${tenantSlug}/calendar`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Voir le calendrier →
              </button>
              <button
                onClick={() => router.push(`/${tenantSlug}`)}
                className="border-2 border-gray-200 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
