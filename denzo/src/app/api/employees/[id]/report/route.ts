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

  const employee = await prisma.employee.findUnique({
    where: { id: numId },
  });
  if (!employee)
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const billItems = await prisma.billItem.findMany({
    where: { employeeId: numId },
    include: {
      service: { select: { name: true } },
      bill: {
        include: {
          customer: { select: { name: true } },
          items: {
            include: {
              service: { select: { id: true, name: true } },
              employee: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { bill: { date: "desc" } },
  });

  const totalServices = billItems.length;
  const totalIncome = billItems.reduce(
    (sum, item) => sum + Number(item.price),
    0,
  );

  const serviceHistory = billItems.map((item) => ({
    date: item.bill.date.toISOString(),
    serviceName: item.service.name,
    customerName: item.bill.customer.name,
    price: Number(item.price),
    billId: item.bill.id,
    paymentMode: item.bill.paymentMode,
    billTotal: Number(item.bill.totalAmount),
    billItems: item.bill.items.map((bi) => ({
      id: bi.id,
      serviceName: bi.service.name,
      employeeName: bi.employee.name,
      price: Number(bi.price),
      isMembershipService: bi.isMembershipService,
    })),
  }));

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      isActive: employee.isActive,
    },
    totalServices,
    totalIncome,
    serviceHistory,
  });
}