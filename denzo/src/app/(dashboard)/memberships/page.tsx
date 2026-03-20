export const dynamic = "force-dynamic";

import { MembershipsClient } from "@/components/memberships/MembershipsClient";
import { prisma } from "@/lib/prisma";

export default async function MembershipsPage() {
  const [memberships, plans, services] = await Promise.all([
    prisma.membership.findMany({
      include: {
        customer: true,
        plan: { include: { planServices: { include: { service: true } } } },
        usages: true,
      },
      orderBy: { id: "desc" },
    }),
    prisma.membershipPlan.findMany({
      include: { planServices: { include: { service: true } } },
      orderBy: { id: "desc" },
    }),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
  ]);

  const formattedMemberships = memberships.map((m) => {
    const isExpired = new Date() > m.expiryDate;
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
      services: m.plan.planServices.map((ps) => {
        const used = m.usages.filter(
          (u) => u.serviceId === ps.serviceId,
        ).length;
        return {
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          allowed: ps.allowedCount,
          used,
          remaining: ps.allowedCount - used,
        };
      }),
    };
  });

  return (
    <MembershipsClient
      initialMemberships={formattedMemberships}
      initialPlans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        validityDays: p.validityDays,
        isActive: p.isActive,
        services: p.planServices.map((ps) => ({
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          allowedCount: ps.allowedCount,
        })),
      }))}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        basePrice: Number(s.basePrice),
      }))}
    />
  );
}
