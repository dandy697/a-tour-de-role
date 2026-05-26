"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddVacationModal({
  familyId,
  mamanLabel,
  papaLabel,
  onClose,
}: {
  familyId: string;
  mamanLabel: string;
  papaLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [owner, setOwner] = useState("maman");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId, startDate, endDate, owner }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'ajout des vacances");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Ajouter des vacances</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent en charge
              </label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              >
                <option value="maman">{mamanLabel}</option>
                <option value="papa">{papaLabel}</option>
                <option value="both">50/50</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
