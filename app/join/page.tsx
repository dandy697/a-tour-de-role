import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (!code) redirect("/");

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/join?code=${code}`)}`);
  }

  const family = await prisma.family.findFirst({
    where: { code },
    include: { tenant: true },
  });

  if (!family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold mb-2">Code invalide</h1>
          <p className="text-gray-500 mb-6">Ce code de famille n'existe pas ou a expiré.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Check limits
  const membersCount = await prisma.familyMember.count({
    where: { familyId: family.id },
  });
  
  const tenantPlan = await prisma.tenant.findUnique({
    where: { id: family.tenantId },
    include: { plan: true },
  });

  const maxMembers = tenantPlan?.maxMembers ?? 5;

  if (membersCount >= maxMembers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Limite atteinte</h1>
          <p className="text-gray-500 mb-6">Cette famille a atteint sa limite de membres ({maxMembers}).</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
        <div className="text-4xl mb-4">👨‍👩‍👧</div>
        <h1 className="text-2xl font-bold mb-2">Rejoindre la famille</h1>
        <p className="text-gray-500 mb-6">
          Vous avez été invité à rejoindre <strong>{family.name}</strong>.
        </p>

        <form action="/api/join" method="POST">
          <input type="hidden" name="familyId" value={family.id} />
          <input type="hidden" name="tenantId" value={family.tenantId} />
          <input type="hidden" name="tenantSlug" value={family.tenant.slug} />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Accepter l'invitation
          </button>
        </form>
      </div>
    </div>
  );
}
