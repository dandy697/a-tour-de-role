import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { familyId, startDate, endDate, owner } = await req.json();

    if (!familyId || !startDate || !endDate || !owner) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const family = await prisma.family.findFirst({
      where: {
        id: familyId,
        tenant: { slug: session.user.tenantSlug },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    const vacation = await prisma.weekendAssignment.create({
      data: {
        familyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        owner,
        type: "vacation",
        createdById: session.user.id,
      },
    });

    return NextResponse.json(vacation);
  } catch (error) {
    console.error("Error creating vacation:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
