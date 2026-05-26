import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest, jsonError } from "@/lib/api-utils";
import { checkPlanLimit } from "@/lib/plan-limits";
import { generateCode } from "@/lib/utils";
import { z } from "zod";

const CreateFamilySchema = z.object({
  name: z.string().min(1).max(80),
  mamanLabel: z.string().min(1).max(30).default("Maman"),
  papaLabel: z.string().min(1).max(30).default("Papa"),
  zone: z.enum(["zone-a", "zone-b", "zone-c"]).default("zone-a"),
  agreement: z.enum(["alternance", "papa_impairs", "maman_impairs"]).default("alternance"),
  weekends: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
      owner: z.enum(["maman", "papa", "50/50"]),
      type: z.enum(["weekend", "school-holiday"]).default("weekend"),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const { user, tenant } = await getTenantFromRequest();

    const canAdd = await checkPlanLimit(tenant.id, "families");
    if (!canAdd) {
      return Response.json(
        { error: "Limite de familles atteinte. Passez au plan Pro." },
        { status: 402 }
      );
    }

    const body = await request.json();
    const parsed = CreateFamilySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }

    const { name, mamanLabel, papaLabel, zone, agreement, weekends } = parsed.data;
    const code = generateCode(6);

    const family = await prisma.family.create({
      data: {
        tenantId: tenant.id,
        name,
        code,
        adminId: user.id,
        mamanLabel,
        papaLabel,
        zone,
        agreement,
        members: { create: { userId: user.id, role: "admin" } },
      },
    });

    // Bulk-create weekends
    await prisma.weekendAssignment.createMany({
      data: weekends.map((w) => ({
        familyId: family.id,
        startDate: new Date(w.startDate),
        endDate: new Date(w.endDate),
        owner: w.owner,
        type: w.type,
        createdById: user.id,
      })),
    });

    // Track usage
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { familiesCount: { increment: 1 } },
    });

    return Response.json(family, { status: 201 });
  } catch (error) {
    console.error("[POST /api/families]", error);
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const { tenant } = await getTenantFromRequest();
    const families = await prisma.family.findMany({
      where: { tenantId: tenant.id },
      include: { _count: { select: { members: true, weekends: true } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(families);
  } catch (error) {
    console.error("[GET /api/families]", error);
    return jsonError(error);
  }
}
