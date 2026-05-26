import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const formData = await req.formData();
    const familyId = formData.get("familyId") as string;
    const tenantId = formData.get("tenantId") as string;
    const tenantSlug = formData.get("tenantSlug") as string;

    if (!familyId || !tenantId || !tenantSlug) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Add UserTenant if not exists
    await prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        tenantId,
        role: "member",
      },
    });

    // Add FamilyMember if not exists
    await prisma.familyMember.upsert({
      where: {
        familyId_userId: {
          familyId,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        familyId,
        userId: session.user.id,
        role: "parent",
      },
    });

    return NextResponse.redirect(new URL(`/${tenantSlug}/calendar?family=${familyId}`, req.url), 303);
  } catch (error) {
    console.error("Error joining family:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
