export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const memberships = await prisma.membership.findMany({
    orderBy: { id: "asc" },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      plan: {
        include: {
          planServices: {
            include: { service: { select: { id: true, name: true } } },
          },
        },
      },
      usages: true,
    },
  });

  return NextResponse.json(
    memberships.map((m) => {
      const serviceUsage = m.plan.planServices.map((ps) => {
        const usedCount = m.usages.filter(
          (u) => u.serviceId === ps.serviceId,
        ).length;
        return {
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          allowedCount: ps.allowedCount,
          usedCount,
          remaining: Math.max(0, ps.allowedCount - usedCount),
        };
      });

      return {
        id: m.id,
        isActive: m.isActive,
        startDate: m.startDate.toISOString(),
        expiryDate: m.expiryDate.toISOString(),
        customer: m.customer,
        plan: {
          id: m.plan.id,
          name: m.plan.name,
          price: Number(m.plan.price),
          validityDays: m.plan.validityDays,
        },
        serviceUsage,
      };
    }),
  );
}

export async function POST(request: Request) {
  const { customerId, planId, startDate } = await request.json();
  if (!customerId || !planId)
    return NextResponse.json(
      { error: "customerId and planId are required" },
      { status: 400 },
    );

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    include: { planServices: true },
  });
  if (!plan)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const start = startDate ? new Date(startDate) : new Date();
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + plan.validityDays);

  try {
    const membership = await prisma.$transaction(async (tx) => {
      // Deactivate any existing active membership for this customer
      await tx.membership.updateMany({
        where: { customerId, isActive: true },
        data: { isActive: false },
      });

      return tx.membership.create({
        data: {
          customerId,
          planId,
          startDate: start,
          expiryDate: expiry,
          isActive: true,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          plan: {
            include: {
              planServices: {
                include: { service: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        id: membership.id,
        isActive: membership.isActive,
        startDate: membership.startDate.toISOString(),
        expiryDate: membership.expiryDate.toISOString(),
        customer: membership.customer,
        plan: {
          id: membership.plan.id,
          name: membership.plan.name,
          price: Number(membership.plan.price),
          validityDays: membership.plan.validityDays,
        },
        serviceUsage: membership.plan.planServices.map((ps) => ({
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          allowedCount: ps.allowedCount,
          usedCount: 0,
          remaining: ps.allowedCount,
        })),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create membership" },
      { status: 400 },
    );
  }
}
