import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const customer = await prisma.customer.findUnique({
    where: { id: numId },
  });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const bills = await prisma.bill.findMany({
    where: { customerId: numId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          service: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    bills: bills.map((bill) => ({
      id: bill.id,
      date: bill.date.toISOString(),
      totalAmount: Number(bill.totalAmount),
      smsSent: bill.smsSent,
      createdAt: bill.createdAt.toISOString(),
      items: bill.items.map((item) => ({
        id: item.id,
        service: item.service,
        employee: item.employee,
        price: Number(item.price),
        isMembershipService: item.isMembershipService,
      })),
    })),
  });
}
