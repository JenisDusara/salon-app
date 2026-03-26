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

  const membership = await prisma.membership.findUnique({
    where: { id: numId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      plan: true,
    },
  });

  if (!membership)
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { planId, balance, isActive } = await request.json();

  try {
    let updateData: Record<string, unknown> = {};

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (planId !== undefined) {
      const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
      if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

      const membership = await prisma.membership.findUnique({ where: { id: numId } });
      if (!membership) return NextResponse.json({ error: "Membership not found" }, { status: 404 });

      const start = membership.startDate;
      const expiry = new Date(start);
      expiry.setDate(expiry.getDate() + plan.validityDays);
      const newBalance = Number(plan.price) * (1 + plan.bonusPercent / 100);

      updateData = { planId, expiryDate: expiry, balance: newBalance };
    }

    if (balance !== undefined) {
      updateData.balance = Number(balance);
    }

    const updated = await prisma.membership.update({
      where: { id: numId },
      data: updateData,
      include: { plan: true },
    });

    const totalBalance = Number(updated.plan.price) * (1 + updated.plan.bonusPercent / 100);
    return NextResponse.json({
      id: updated.id,
      balance: Number(updated.balance),
      totalBalance,
      planId: updated.planId,
      expiryDate: updated.expiryDate.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.membership.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
}
