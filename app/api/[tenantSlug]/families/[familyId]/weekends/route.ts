import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest, jsonError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; familyId: string }> }
) {
  try {
    const { tenantSlug, familyId } = await params;
    const { tenant } = await getTenantFromRequest(tenantSlug);

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const weekends = await prisma.weekendAssignment.findMany({
      where: {
        familyId,
        family: { tenantId: tenant.id },
        ...(from && to
          ? { startDate: { gte: new Date(from) }, endDate: { lte: new Date(to) } }
          : {}),
      },
      orderBy: { startDate: "asc" },
    });

    return Response.json(weekends);
  } catch (error) {
    console.error("[GET /api/[tenantSlug]/families/[familyId]/weekends]", error);
    return jsonError(error);
  }
}
