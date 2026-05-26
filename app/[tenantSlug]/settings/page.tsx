import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  async function updateProfile(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;

    const name = formData.get("name") as string;
    
    if (name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }
    
    revalidatePath("/", "layout");
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Profil</h2>
        <form action={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              name="name"
              defaultValue={user.name || ""}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled
              defaultValue={user.email}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié car il est lié à votre compte Google.</p>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Sauvegarder les modifications
          </button>
        </form>
      </div>
    </div>
  );
}
