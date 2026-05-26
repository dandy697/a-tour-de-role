import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PushSubscribeButton } from "@/components/notifications/PushSubscribeButton";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userTenant = await prisma.userTenant.findFirst({
    where: { userId: session.user.id, tenant: { slug: tenantSlug } },
    include: { tenant: { include: { plan: true } } },
  });

  if (!userTenant) redirect("/login");

  const { tenant } = userTenant;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Left: logo + nav links */}
          <div className="flex items-center gap-5">
            <Link
              href={`/${tenantSlug}`}
              className="flex items-center gap-2 font-bold text-orange-600"
            >
              <span>👨‍👩‍👧</span>
              <span className="hidden sm:inline">À Tour de Rôle</span>
            </Link>

            <div className="flex items-center gap-0.5 text-sm">
              <Link
                href={`/${tenantSlug}`}
                className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={`/${tenantSlug}/calendar`}
                className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Calendrier
              </Link>
              <Link
                href={`/${tenantSlug}/exchanges`}
                className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Échanges
              </Link>
            </div>
          </div>

          {/* Right: plan badge + bell + settings + signout */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full capitalize hidden sm:inline">
              {tenant.plan.name}
            </span>

            {/* Push subscribe — demande la permission navigateur */}
            <PushSubscribeButton />

            {/* Notification bell — client component, polls /api/notifications */}
            <NotificationBell />

            <Link
              href={`/${tenantSlug}/settings/billing`}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Paramètres & facturation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
