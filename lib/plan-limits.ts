import { prisma } from "@/lib/db";

export const PLAN_LIMITS = {
  free: {
    maxFamilies: 1,
    maxMembers: 5,
    features: { chat: false, analytics: false },
  },
  pro: {
    maxFamilies: 3,
    maxMembers: 20,
    features: { chat: true, analytics: false },
  },
  premium: {
    maxFamilies: -1,
    maxMembers: -1,
    features: { chat: true, analytics: true },
  },
} as const;

type LimitType = "families" | "members";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function checkPlanLimit(tenantId: string, limitType: LimitType) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
  if (!tenant) return false;

  const planName = tenant.plan.name.toLowerCase() as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[planName];
  const limitKey = `max${capitalize(limitType)}` as `max${Capitalize<LimitType>}`;
  const countKey = `${limitType}Count` as `${LimitType}Count`;

  const maxAllowed = limits[limitKey as keyof typeof limits] as number;
  if (maxAllowed === -1) return true;

  const current = tenant[countKey as keyof typeof tenant] as number;
  return current < maxAllowed;
}

export async function getPlanFeature(
  tenantId: string,
  feature: keyof (typeof PLAN_LIMITS)["free"]["features"]
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
  if (!tenant) return false;

  const planName = tenant.plan.name.toLowerCase() as keyof typeof PLAN_LIMITS;
  return PLAN_LIMITS[planName].features[feature] ?? false;
}
