import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CopyInviteButton } from "@/components/CopyInviteButton";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) redirect("/login");

  const families = await prisma.family.findMany({
    where: { tenantId: tenant.id },
    include: {
      weekends: {
        where: { startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 3,
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const canAddFamily = families.length < tenant.maxFamilies;

  const upcomingWeekends = await prisma.weekendAssignment.findMany({
    where: {
      family: { tenant: { slug: tenantSlug } },
      startDate: { gte: new Date() },
    },
    include: { family: true },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bonjour, {session.user.name?.split(" ")[0]} 👋
          </p>
        </div>
        {families.length === 0 && canAddFamily && (
          <Link
            href={`/${tenantSlug}/onboarding`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Créer une famille
          </Link>
        )}
      </div>

      {families.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="text-6xl mb-4">👨‍👩‍👧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune famille configurée</h2>
          <p className="text-gray-500 mb-6">
            Créez votre première configuration de garde en 5 minutes.
          </p>
          <Link
            href={`/${tenantSlug}/onboarding`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Commencer la configuration →
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Families list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
              Mes familles
            </h2>
            {families.map((family) => (
              <div key={family.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{family.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Code: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{family.code}</span>
                      <CopyInviteButton code={family.code} />
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {family._count.members} membre{family._count.members !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/${tenantSlug}/calendar?family=${family.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Voir calendrier →
                  </Link>
                </div>

                {family.weekends.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      Prochains week-ends
                    </p>
                    {family.weekends.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-gray-600">{formatDate(w.startDate)}</span>
                        <span
                          className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                            w.owner === "maman"
                              ? "bg-pink-100 text-pink-700"
                              : w.owner === "papa"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {w.owner === "maman"
                            ? family.mamanLabel
                            : w.owner === "papa"
                              ? family.papaLabel
                              : "50/50"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {canAddFamily ? (
              <Link
                href={`/${tenantSlug}/onboarding`}
                className="block text-center border-2 border-dashed border-gray-200 rounded-2xl p-4 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                + Ajouter une famille
              </Link>
            ) : (
              <div className="block text-center border-2 border-dashed border-gray-100 bg-gray-50 rounded-2xl p-4 text-sm text-gray-400">
                <span className="mb-1 block">🔒 Limite atteinte ({tenant.maxFamilies} famille{tenant.maxFamilies > 1 ? 's' : ''})</span>
                <Link href={`/${tenantSlug}/settings/billing`} className="text-blue-600 hover:underline">
                  Passez au plan Pro
                </Link> pour en ajouter d'autres.
              </div>
            )}
          </div>

          {/* Upcoming sidebar */}
          <div>
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
              À venir
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {upcomingWeekends.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 text-center">Aucun week-end à venir</p>
              ) : (
                upcomingWeekends.map((w) => (
                  <div key={w.id} className="p-4">
                    <p className="text-xs text-gray-400 mb-0.5">{w.family.name}</p>
                    <p className="text-sm font-medium">{formatDate(w.startDate)}</p>
                    <span
                      className={`text-xs font-medium ${
                        w.owner === "maman"
                          ? "text-pink-600"
                          : w.owner === "papa"
                            ? "text-blue-600"
                            : "text-purple-600"
                      }`}
                    >
                      {w.owner === "maman"
                        ? w.family.mamanLabel
                        : w.owner === "papa"
                          ? w.family.papaLabel
                          : "50/50"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
