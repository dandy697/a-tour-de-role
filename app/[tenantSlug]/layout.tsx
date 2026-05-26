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

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5 text-sm">
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

      <main className="max-w-5xl mx-auto px-4 py-8 mb-16 md:mb-0">{children}</main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-50">
        <Link href={`/${tenantSlug}`} className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>
        <Link href={`/${tenantSlug}/calendar`} className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[10px] font-medium">Agenda</span>
        </Link>
        <Link href={`/${tenantSlug}/settings/profile`} className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </div>
    </div>
  );
}
