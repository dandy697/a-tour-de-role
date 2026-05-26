import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("Unauthorized", 401);
  return session.user;
}

export async function getTenantFromRequest(tenantSlug?: string | null) {
  const user = await getAuthenticatedUser();

  const where = tenantSlug
    ? { userId: user.id, tenant: { slug: tenantSlug } }
    : { userId: user.id };

  const userTenant = await prisma.userTenant.findFirst({
    where,
    include: { tenant: { include: { plan: true } } },
  });

  if (!userTenant) throw new ApiError("Forbidden", 403);

  return { user, tenant: userTenant.tenant, role: userTenant.role };
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
