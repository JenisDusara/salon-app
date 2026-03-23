export const dynamic = "force-dynamic";

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
    where: { customerId: numId, isActive: true, expiryDate: { gte: now } },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      plan: true,
    },
  });

  if (!membership)
    return NextResponse.json(
      { error: "No active membership found for this customer" },
      { status: 404 },
    );

  const totalBalance = Number(membership.plan.price) * (1 + membership.plan.bonusPercent / 100);

  return NextResponse.json({
    id: membership.id,
    isActive: membership.isActive,
    startDate: membership.startDate.toISOString(),
    expiryDate: membership.expiryDate.toISOString(),
    balance: Number(membership.balance),
    totalBalance,
    customer: membership.customer,
    plan: {
      id: membership.plan.id,
      name: membership.plan.name,
      price: Number(membership.plan.price),
      bonusPercent: membership.plan.bonusPercent,
      validityDays: membership.plan.validityDays,
    },
  });
}
