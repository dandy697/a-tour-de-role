import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ExchangePanel } from "@/components/exchanges/ExchangePanel";

export default async function ExchangesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const families = await prisma.family.findMany({
    where: { tenant: { slug: tenantSlug } },
    orderBy: { createdAt: "asc" },
  });

  if (families.length === 0) redirect(`/${tenantSlug}/onboarding`);

  // Load pending exchanges across all families
  const exchanges = await prisma.exchangeRequest.findMany({
    where: {
      family: { tenant: { slug: tenantSlug } },
      status: "pending",
    },
    include: {
      family: true,
      requestedBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Échanges de week-ends</h1>
        <p className="text-gray-500 text-sm mt-1">
          Proposez et gérez les échanges avec l&apos;autre parent.
        </p>
      </div>

      <ExchangePanel
        tenantSlug={tenantSlug}
        families={families.map((f) => ({
          id: f.id,
          name: f.name,
          mamanLabel: f.mamanLabel,
          papaLabel: f.papaLabel,
        }))}
        initialExchanges={exchanges.map((e) => ({
          id: e.id,
          familyId: e.familyId,
          familyName: e.family.name,
          requestedById: e.requestedById,
          requesterName: e.requestedBy.name ?? "Inconnu",
          targetDate: e.targetDate.toISOString(),
          proposedDate: e.proposedDate?.toISOString() ?? null,
          reason: e.reason ?? null,
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
