export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const memberships = await prisma.membership.findMany({
    orderBy: { id: "asc" },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      plan: true,
    },
  });

  return NextResponse.json(
    memberships.map((m) => {
      const totalBalance = Number(m.plan.price) * (1 + m.plan.bonusPercent / 100);
      return {
        id: m.id,
        isActive: m.isActive,
        startDate: m.startDate.toISOString(),
        expiryDate: m.expiryDate.toISOString(),
        balance: Number(m.balance),
        totalBalance,
        customer: m.customer,
        plan: {
          id: m.plan.id,
          name: m.plan.name,
          price: Number(m.plan.price),
          bonusPercent: m.plan.bonusPercent,
          validityDays: m.plan.validityDays,
        },
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

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const start = startDate ? new Date(startDate) : new Date();
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + plan.validityDays);

  // Initial balance = price paid + bonus
  const initialBalance = Number(plan.price) * (1 + plan.bonusPercent / 100);

  try {
    const membership = await prisma.$transaction(async (tx) => {
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
          balance: initialBalance,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          plan: true,
        },
      });
    });

    const totalBalance = Number(membership.plan.price) * (1 + membership.plan.bonusPercent / 100);
    return NextResponse.json(
      {
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
