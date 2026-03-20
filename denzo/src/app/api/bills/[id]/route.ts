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

  const bill = await prisma.bill.findUnique({
    where: { id: numId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      items: {
        include: {
          service: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!bill)
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  return NextResponse.json({
    id: bill.id,
    date: bill.date.toISOString(),
    totalAmount: Number(bill.totalAmount),
    smsSent: bill.smsSent,
    createdAt: bill.createdAt.toISOString(),
    customer: bill.customer,
    items: bill.items.map((item) => ({
      id: item.id,
      service: item.service,
      employee: item.employee,
      price: Number(item.price),
      isMembershipService: item.isMembershipService,
    })),
  });
}
