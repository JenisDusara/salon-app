export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  // Date ranges
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const [
    todayBills,
    monthlyBills,
    allBills,
    todayExpensesData,
    monthlyExpensesData,
    allExpensesData,
    totalCustomers,
    activeEmployees,
    allBillItems,
  ] = await Promise.all([
    prisma.bill.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.bill.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.bill.findMany(),
    prisma.expense.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.expense.findMany(),
    prisma.customer.count(),
    prisma.employee.findMany({ where: { isActive: true } }),
    prisma.billItem.findMany({
      include: {
        employee: { select: { id: true, name: true } },
      },
    }),
  ]);

  const todayIncome = todayBills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const todayExpenses = todayExpensesData.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );
  const monthlyIncome = monthlyBills.reduce(
    (s, b) => s + Number(b.totalAmount),
    0,
  );
  const monthlyExpenses = monthlyExpensesData.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );
  const overallIncome = allBills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const overallExpenses = allExpensesData.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );

  // Labour income: per active employee
  const labourIncome = activeEmployees.map((emp) => {
    const empItems = allBillItems.filter((item) => item.employeeId === emp.id);
    const totalEarned = empItems.reduce((s, item) => s + Number(item.price), 0);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      totalIncome: totalEarned,
      serviceCount: empItems.length,
    };
  });

  // Today's membership activity: bills today with membership items, grouped by customer
  const todayBillsWithItems = await prisma.bill.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        where: { isMembershipService: true },
        include: {
          service: { select: { id: true, name: true } },
        },
      },
    },
  });

  const membershipActivityMap: Record<
    number,
    {
      customerId: number;
      customerName: string;
      phone: string;
      servicesUsed: { serviceName: string; billId: number }[];
    }
  > = {};

  for (const bill of todayBillsWithItems) {
    if (bill.items.length === 0) continue;
    if (!membershipActivityMap[bill.customer.id]) {
      membershipActivityMap[bill.customer.id] = {
        customerId: bill.customer.id,
        customerName: bill.customer.name,
        phone: bill.customer.phone,
        servicesUsed: [],
      };
    }
    for (const item of bill.items) {
      membershipActivityMap[bill.customer.id].servicesUsed.push({
        serviceName: item.service.name,
        billId: bill.id,
      });
    }
  }

  const todayMembershipActivity = Object.values(membershipActivityMap);

  return NextResponse.json({
    todayIncome,
    todayExpenses,
    monthlyIncome,
    monthlyExpenses,
    overallIncome,
    overallExpenses,
    totalCustomers,
    labourIncome,
    todayMembershipActivity,
  });
}
