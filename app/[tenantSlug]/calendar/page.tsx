import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import Link from "next/link";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ family?: string; month?: string; year?: string }>;
}) {
  const { tenantSlug } = await params;
  const { family: familyId, month, year } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const families = await prisma.family.findMany({
    where: { tenant: { slug: tenantSlug } },
    orderBy: { createdAt: "asc" },
  });

  if (families.length === 0) redirect(`/${tenantSlug}/onboarding`);

  const activeFamilyId = familyId ?? families[0].id;
  const activeFamily = families.find((f) => f.id === activeFamilyId) ?? families[0];

  const now = new Date();
  const viewYear = year ? parseInt(year) : now.getFullYear();
  const viewMonth = month ? parseInt(month) : now.getMonth();

  const startOfRange = new Date(viewYear, viewMonth - 1, 1);
  const endOfRange = new Date(viewYear, viewMonth + 2, 0);

  const weekends = await prisma.weekendAssignment.findMany({
    where: {
      familyId: activeFamily.id,
      startDate: { gte: startOfRange },
      endDate: { lte: endOfRange },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendrier</h1>
        {families.length > 1 && (
          <div className="flex gap-2">
            {families.map((f) => (
              <Link
                key={f.id}
                href={`/${tenantSlug}/calendar?family=${f.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  f.id === activeFamily.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <CalendarGrid
        family={activeFamily}
        weekends={weekends.map((w) => ({
          ...w,
          startDate: w.startDate.toISOString(),
          endDate: w.endDate.toISOString(),
        }))}
        initialYear={viewYear}
        initialMonth={viewMonth}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
