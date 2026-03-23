export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { name, price, bonusPercent, validityDays } = body;

  try {
    const plan = await prisma.membershipPlan.update({
      where: { id: numId },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(bonusPercent !== undefined && { bonusPercent }),
        ...(validityDays !== undefined && { validityDays }),
      },
    });

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      bonusPercent: plan.bonusPercent,
      validityDays: plan.validityDays,
      isActive: plan.isActive,
    });
  } catch {
    return NextResponse.json(
      { error: "Plan not found or update failed" },
      { status: 404 },
    );
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
    const membershipCount = await prisma.membership.count({ where: { planId: numId } });

    if (membershipCount > 0) {
      // Has memberships — just deactivate
      const plan = await prisma.membershipPlan.update({
        where: { id: numId },
        data: { isActive: false },
      });
      return NextResponse.json({
        deactivated: true,
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        bonusPercent: plan.bonusPercent,
        validityDays: plan.validityDays,
        isActive: plan.isActive,
      });
    }

    await prisma.membershipPlan.delete({ where: { id: numId } });
    return NextResponse.json({ success: true, deleted: true });
  } catch {
    return NextResponse.json({ error: "Delete failed." }, { status: 400 });
  }
}
