import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { id: "asc" },
    include: {
      planServices: {
        include: {
          service: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      validityDays: plan.validityDays,
      services: plan.planServices.map((ps) => ({
        id: ps.id,
        serviceId: ps.serviceId,
        serviceName: ps.service.name,
        allowedCount: ps.allowedCount,
      })),
    }))
  );
}

export async function POST(request: Request) {
  const { name, price, validityDays, services } = await request.json();
  if (!name || price === undefined || !validityDays)
    return NextResponse.json(
      { error: "name, price, and validityDays are required" },
      { status: 400 }
    );

  try {
    const plan = await prisma.membershipPlan.create({
      data: {
        name,
        price,
        validityDays,
        planServices:
          services && Array.isArray(services)
            ? {
                create: services.map(
                  (s: { serviceId: number; allowedCount: number }) => ({
                    serviceId: s.serviceId,
                    allowedCount: s.allowedCount,
                  })
                ),
              }
            : undefined,
      },
      include: {
        planServices: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        validityDays: plan.validityDays,
        services: plan.planServices.map((ps) => ({
          id: ps.id,
          serviceId: ps.serviceId,
          serviceName: ps.service.name,
          allowedCount: ps.allowedCount,
        })),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create plan" }, { status: 400 });
  }
}
