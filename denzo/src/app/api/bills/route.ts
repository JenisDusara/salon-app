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
  const { customerId, items, date } = body as {
    customerId: number;
    items: { serviceId: number; employeeId: number; price?: number }[];
    date?: string;
  };

  if (!customerId || !items || !Array.isArray(items) || items.length === 0)
    return NextResponse.json(
      { error: "customerId and items are required" },
      { status: 400 },
    );

  // 1. Find customer
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // 2. Find active non-expired membership with plan services
  const now = new Date();
  const membership = await prisma.membership.findFirst({
    where: {
      customerId,
      isActive: true,
      expiryDate: { gte: now },
    },
    include: {
      plan: {
        include: {
          planServices: {
            include: { service: true },
          },
        },
      },
    },
  });

  // 3. Process each item — apply membership if quota is available
  const processedItems: {
    serviceId: number;
    employeeId: number;
    price: number;
    isMembershipService: boolean;
  }[] = [];

  // Track in-memory usage increments per service during this bill
  const inMemoryUsage: Record<number, number> = {};

  for (const item of items) {
    let price = item.price ?? 0;
    let isMembershipService = false;

    if (membership) {
      const planService = membership.plan.planServices.find(
        (ps) => ps.serviceId === item.serviceId,
      );

      if (planService) {
        // Count existing usage from DB
        const dbUsageCount = await prisma.membershipUsage.count({
          where: {
            membershipId: membership.id,
            serviceId: item.serviceId,
          },
        });

        const usedSoFarThisBill = inMemoryUsage[item.serviceId] ?? 0;
        const totalUsed = dbUsageCount + usedSoFarThisBill;

        if (totalUsed < planService.allowedCount) {
          price = 0;
          isMembershipService = true;
          inMemoryUsage[item.serviceId] = usedSoFarThisBill + 1;
        }
      }
    }

    // If no price override from membership and item.price was provided, use it
    if (!isMembershipService && item.price !== undefined) {
      price = item.price;
    } else if (!isMembershipService) {
      // Fall back to service basePrice
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
      });
      price = service ? Number(service.basePrice) : 0;
    }

    processedItems.push({
      serviceId: item.serviceId,
      employeeId: item.employeeId,
      price,
      isMembershipService,
    });
  }

  const totalAmount = processedItems.reduce((sum, i) => sum + i.price, 0);
  const billDate = date ? new Date(date) : now;

  // 4. Create bill and items in a transaction
  const bill = await prisma.$transaction(async (tx) => {
    const newBill = await tx.bill.create({
      data: {
        customerId,
        date: billDate,
        totalAmount,
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

    // 5. Create MembershipUsage records for membership services
    if (membership) {
      const membershipItems = processedItems.filter(
        (i) => i.isMembershipService,
      );
      for (const mi of membershipItems) {
        // Find the bill item that was just created for this service
        const billItem = newBill.items.find(
          (it) => it.serviceId === mi.serviceId && it.isMembershipService,
        );
        if (!billItem) continue;
        await tx.membershipUsage.create({
          data: {
            membershipId: membership.id,
            serviceId: mi.serviceId,
            billItemId: billItem.id,
            usedAt: billDate,
          },
        });
      }
    }

    // 6. Update smsSent flag
    const updatedBill = await tx.bill.update({
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

    return updatedBill;
  });

  // 7. SMS placeholder
  console.log(
    `[SMS] Bill #${bill.id} for customer ${customer.name} (${customer.phone}): Total ₹${totalAmount}. Thank you for visiting!`,
  );

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  );
}
