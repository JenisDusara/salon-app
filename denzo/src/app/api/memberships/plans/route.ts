export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      bonusPercent: plan.bonusPercent,
      validityDays: plan.validityDays,
      isActive: plan.isActive,
    })),
  );
}

export async function POST(request: Request) {
  const { name, price, bonusPercent, validityDays } = await request.json();
  if (!name || price === undefined || !validityDays)
    return NextResponse.json(
      { error: "name, price, and validityDays are required" },
      { status: 400 },
    );

  try {
    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price,
        bonusPercent: bonusPercent ?? 100,
        validityDays,
      },
    });

    return NextResponse.json(
      {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        bonusPercent: plan.bonusPercent,
        validityDays: plan.validityDays,
        isActive: plan.isActive,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 400 },
    );
  }
}
