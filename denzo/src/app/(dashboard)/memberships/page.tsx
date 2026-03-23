export const dynamic = "force-dynamic";

import { MembershipsClient } from "@/components/memberships/MembershipsClient";
import { prisma } from "@/lib/prisma";

export default async function MembershipsPage() {
  const [memberships, plans] = await Promise.all([
    prisma.membership.findMany({
      include: { customer: true, plan: true },
      orderBy: { id: "desc" },
    }),
    prisma.membershipPlan.findMany({ orderBy: { id: "desc" } }),
  ]);

  const formattedMemberships = memberships.map((m) => {
    const isExpired = new Date() > m.expiryDate;
    const totalBalance = Number(m.plan.price) * (1 + m.plan.bonusPercent / 100);
    return {
      id: m.id,
      customerId: m.customerId,
      customerName: m.customer.name,
      planId: m.planId,
      planName: m.plan.name,
      startDate: m.startDate.toISOString(),
      expiryDate: m.expiryDate.toISOString(),
      isActive: m.isActive,
      isExpired,
      balance: Number(m.balance),
      totalBalance,
    };
  });

  return (
    <MembershipsClient
      initialMemberships={formattedMemberships}
      initialPlans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        bonusPercent: p.bonusPercent,
        validityDays: p.validityDays,
        isActive: p.isActive,
      }))}
    />
  );
}
