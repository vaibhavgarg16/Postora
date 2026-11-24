import { PrismaClient } from "@prisma/client"
import { PLAN_CATALOG } from "../src/lib/plans"

const prisma = new PrismaClient()

async function main() {
  for (const plan of PLAN_CATALOG) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPriceInr: plan.monthlyPriceInr,
        yearlyPriceInr: plan.yearlyPriceInr,
        limits: plan.limits,
        features: plan.features,
        sortOrder: plan.sortOrder,
        active: true,
      },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPriceInr: plan.monthlyPriceInr,
        yearlyPriceInr: plan.yearlyPriceInr,
        limits: plan.limits,
        features: plan.features,
        sortOrder: plan.sortOrder,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
