import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.plan.upsert({
    where: { name: "free" },
    update: {},
    create: {
      name: "free",
      priceMonthly: 0,
      maxFamilies: 1,
      maxMembers: 5,
      features: { chat: false, analytics: false },
    },
  });

  await prisma.plan.upsert({
    where: { name: "pro" },
    update: {},
    create: {
      name: "pro",
      priceMonthly: 4.99,
      maxFamilies: 3,
      maxMembers: 20,
      features: { chat: true, analytics: false },
    },
  });

  await prisma.plan.upsert({
    where: { name: "premium" },
    update: {},
    create: {
      name: "premium",
      priceMonthly: 9.99,
      maxFamilies: -1,
      maxMembers: -1,
      features: { chat: true, analytics: true },
    },
  });

  console.log("✅ Plans seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
