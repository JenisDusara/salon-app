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
  const { name, price, validityDays, services } = body;

  try {
    const plan = await prisma.$transaction(async (tx) => {
      // If services array is provided, delete existing planServices and recreate
      if (services && Array.isArray(services)) {
        await tx.membershipPlanService.deleteMany({ where: { planId: numId } });
      }

      const updated = await tx.membershipPlan.update({
        where: { id: numId },
        data: {
          ...(name !== undefined && { name }),
          ...(price !== undefined && { price }),
          ...(validityDays !== undefined && { validityDays }),
          ...(services && Array.isArray(services)
            ? {
                planServices: {
                  create: services.map(
                    (s: { serviceId: number; allowedCount: number }) => ({
                      serviceId: s.serviceId,
                      allowedCount: s.allowedCount,
                    }),
                  ),
                },
              }
            : {}),
        },
        include: {
          planServices: {
            include: {
              service: { select: { id: true, name: true } },
            },
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
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
    });
  } catch {
    return NextResponse.json(
      { error: "Plan not found or update failed" },
      { status: 404 },
    );
  }
}
