import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        const existing = await prisma.userTenant.findFirst({
          where: { userId: user.id! },
          select: { tenantId: true, tenant: { select: { slug: true } } },
        });

        if (!existing) {
          const freePlan = await prisma.plan.findUnique({ where: { name: "free" } });
          const tenant = await prisma.tenant.create({
            data: {
              name: user.name || "Mon espace",
              slug: `t-${user.id!.slice(0, 8)}`,
              planId: freePlan!.id,
              billingEmail: user.email!,
              users: { create: { userId: user.id!, role: "admin" } },
            },
          });
          token.tenantId = tenant.id;
          token.tenantSlug = tenant.slug;
        } else {
          token.tenantId = existing.tenantId;
          token.tenantSlug = existing.tenant.slug;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
