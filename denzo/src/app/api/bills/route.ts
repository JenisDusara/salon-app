export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          service: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    bills.map((bill) => ({
      id: bill.id,
      date: bill.date.toISOString(),
      totalAmount: Number(bill.totalAmount),
      smsSent: bill.smsSent,
      paymentMode: bill.paymentMode,
      createdAt: bill.createdAt.toISOString(),
      customer: bill.customer,
      items: bill.items.map((item) => ({
        id: item.id,
        service: item.service,
        employee: item.employee,
        price: Number(item.price),
        isMembershipService: item.isMembershipService,
      })),
    })),
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerId, items, date, paymentMode } = body as {
    customerId: number;
    items: { serviceId: number; employeeId: number; price?: number }[];
    date?: string;
    paymentMode: string;
  };

  if (!paymentMode || !["cash", "card", "online", "membership"].includes(paymentMode))
    return NextResponse.json({ error: "Valid paymentMode is required" }, { status: 400 });

  if (!customerId || !items || !Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "customerId and items are required" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const now = new Date();
  const billDate = date ? new Date(date) : now;

  // Resolve prices from service base price if not provided
  const processedItems: {
    serviceId: number;
    employeeId: number;
    price: number;
    isMembershipService: boolean;
  }[] = [];

  for (const item of items) {
    let price = item.price ?? 0;
    if (item.price === undefined) {
      const svc = await prisma.service.findUnique({ where: { id: item.serviceId } });
      price = svc ? Number(svc.basePrice) : 0;
    }
    processedItems.push({
      serviceId: item.serviceId,
      employeeId: item.employeeId,
      price,
      isMembershipService: paymentMode === "membership",
    });
  }

  const totalAmount = processedItems.reduce((sum, i) => sum + i.price, 0);

  // If paying with membership, validate balance
  if (paymentMode === "membership") {
    const membership = await prisma.membership.findFirst({
      where: { customerId, isActive: true, expiryDate: { gte: now } },
    });
    if (!membership)
      return NextResponse.json({ error: "No active membership found" }, { status: 400 });
    if (Number(membership.balance) < totalAmount)
      return NextResponse.json(
        { error: `Insufficient membership balance. Available: ₹${Number(membership.balance).toFixed(2)}` },
        { status: 400 },
      );
  }

  const bill = await prisma.$transaction(async (tx) => {
    const newBill = await tx.bill.create({
      data: {
        customerId,
        date: billDate,
        totalAmount,
        paymentMode,
        smsSent: false,
        items: {
          create: processedItems.map((i) => ({
            serviceId: i.serviceId,
            employeeId: i.employeeId,
            price: i.price,
            isMembershipService: i.isMembershipService,
          })),
        },
      },
      include: {
        items: {
          include: {
            service: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Deduct from membership balance
    if (paymentMode === "membership") {
      await tx.membership.updateMany({
        where: { customerId, isActive: true, expiryDate: { gte: now } },
        data: { balance: { decrement: totalAmount } },
      });
    }

    return tx.bill.update({
      where: { id: newBill.id },
      data: { smsSent: true },
      include: {
        items: {
          include: {
            service: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
  });

  console.log(
    `[SMS] Bill #${bill.id} for ${customer.name} (${customer.phone}): ₹${totalAmount} via ${paymentMode}`,
  );

  return NextResponse.json(
    {
      id: bill.id,
      date: bill.date.toISOString(),
      totalAmount: Number(bill.totalAmount),
      smsSent: bill.smsSent,
      paymentMode: bill.paymentMode,
      createdAt: bill.createdAt.toISOString(),
      customer: bill.customer,
      items: bill.items.map((item) => ({
        id: item.id,
        service: item.service,
        employee: item.employee,
        price: Number(item.price),
        isMembershipService: item.isMembershipService,
      })),
    },
    { status: 201 },
  );
}
