import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const now = new Date();
  const membership = await prisma.membership.findFirst({
    where: {
      customerId: numId,
      isActive: true,
      expiryDate: { gte: now },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
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

  if (!membership)
    return NextResponse.json(
      { error: "No active membership found for this customer" },
      { status: 404 },
    );

  const serviceUsage = membership.plan.planServices.map((ps) => {
    const usedCount = membership.usages.filter(
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

  return NextResponse.json({
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
    serviceUsage,
  });
}
