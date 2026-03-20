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

  const membership = await prisma.membership.findUnique({
    where: { id: numId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      plan: {
        include: {
          planServices: {
            include: { service: { select: { id: true, name: true } } },
          },
        },
      },
      usages: {
        include: {
          service: { select: { id: true, name: true } },
          billItem: {
            include: {
              bill: { select: { id: true, date: true } },
            },
          },
        },
        orderBy: { usedAt: "desc" },
      },
    },
  });

  if (!membership)
    return NextResponse.json(
      { error: "Membership not found" },
      { status: 404 },
    );

  const serviceUsage = membership.plan.planServices.map((ps) => {
    const serviceUsages = membership.usages.filter(
      (u) => u.serviceId === ps.serviceId,
    );
    const usedCount = serviceUsages.length;
    return {
      serviceId: ps.serviceId,
      serviceName: ps.service.name,
      allowedCount: ps.allowedCount,
      usedCount,
      remaining: Math.max(0, ps.allowedCount - usedCount),
      usageHistory: serviceUsages.map((u) => ({
        id: u.id,
        usedAt: u.usedAt.toISOString(),
        billId: u.billItem.bill.id,
        billDate: u.billItem.bill.date.toISOString(),
      })),
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
