import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { PricingTable } from "@/components/billing/PricingTable";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const { tenantSlug } = await params;
  const { success, cancelled } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userTenant = await prisma.userTenant.findFirst({
    where: { userId: session.user.id, tenant: { slug: tenantSlug } },
    include: {
      tenant: {
        include: {
          plan: true,
          subscription: true,
          invoices: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  if (!userTenant) redirect("/login");
  const { tenant } = userTenant;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Abonnement & Facturation</h1>
      <p className="text-gray-500 text-sm mb-8">Gérez votre plan et vos paiements.</p>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 text-sm font-medium">
          ✅ Paiement réussi ! Votre plan a été mis à jour.
        </div>
      )}
      {cancelled && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          ⚠️ Paiement annulé. Votre plan n&apos;a pas été modifié.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-bold mb-4">Plan actuel</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold capitalize">{tenant.plan.name}</p>
            <p className="text-gray-500 text-sm">
              {tenant.plan.priceMonthly === 0
                ? "Gratuit pour toujours"
                : `€${tenant.plan.priceMonthly}/mois`}
            </p>
          </div>
          {tenant.subscription && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                tenant.subscription.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tenant.subscription.status === "active" ? "Actif" : tenant.subscription.status}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            Familles:{" "}
            <strong>
              {tenant.familiesCount} / {tenant.maxFamilies === -1 ? "∞" : tenant.maxFamilies}
            </strong>
          </div>
          <div>
            Membres:{" "}
            <strong>
              {tenant.membersCount} / {tenant.maxMembers === -1 ? "∞" : tenant.maxMembers}
            </strong>
          </div>
        </div>
      </div>

      {/* Upgrade */}
      {tenant.plan.name === "free" && (
        <PricingTable
          tenantSlug={tenantSlug}
          currentPlan={tenant.plan.name}
          plans={PLANS}
        />
      )}

      {/* Invoices */}
      {tenant.invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
          <h2 className="font-bold mb-4">Factures récentes</h2>
          <div className="space-y-3">
            {tenant.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium">
                    {inv.createdAt
                      ? new Date(inv.createdAt).toLocaleDateString("fr-FR")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">€{inv.amount.toFixed(2)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {inv.status === "paid" ? "Payé" : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
