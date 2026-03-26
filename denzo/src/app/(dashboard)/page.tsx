export const dynamic = "force-dynamic";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { prisma } from "@/lib/prisma";
import { getMonthRange, getTodayRange } from "@/lib/utils";
import type { PaymentBreakdown } from "@/types";

function toBreakdown(groups: { paymentMode: string; _sum: { totalAmount: unknown } }[]): PaymentBreakdown {
  const result: PaymentBreakdown = { cash: 0, card: 0, online: 0, membership: 0 };
  for (const g of groups) {
    const mode = g.paymentMode as keyof PaymentBreakdown;
    if (mode in result) result[mode] = Number(g._sum.totalAmount ?? 0);
  }
  return result;
}

export default async function DashboardPage() {
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const last7Ranges = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    return { start, end, label: d.toLocaleDateString("en-IN", { weekday: "short" }) };
  });
  const weekStart = last7Ranges[0].start;
  const weekEnd   = last7Ranges[6].end;

  // Sequential queries — one at a time, no connection overload
  const todayIncomeAgg    = await prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { date: { gte: todayStart, lte: todayEnd } } });
  const monthlyIncomeAgg  = await prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });
  const totalIncomeAgg    = await prisma.bill.aggregate({ _sum: { totalAmount: true } });
  const todayExpAgg       = await prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: todayStart, lte: todayEnd } } });
  const monthlyExpAgg     = await prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });
  const totalExpAgg       = await prisma.expense.aggregate({ _sum: { amount: true } });
  const totalCustomers    = await prisma.customer.count();
  const todayBreakdownRaw = await prisma.bill.groupBy({ by: ["paymentMode"], _sum: { totalAmount: true }, where: { date: { gte: todayStart, lte: todayEnd } } });
  const monthlyBreakdownRaw = await prisma.bill.groupBy({ by: ["paymentMode"], _sum: { totalAmount: true }, where: { date: { gte: monthStart, lte: monthEnd } } });
  const membershipsRaw    = await prisma.membership.findMany({ include: { customer: true, plan: true }, orderBy: { id: "desc" } });
  const billsWeek         = await prisma.bill.findMany({ where: { date: { gte: weekStart, lte: weekEnd } }, select: { date: true, totalAmount: true } });
  const expensesWeek      = await prisma.expense.findMany({ where: { date: { gte: weekStart, lte: weekEnd } }, select: { date: true, amount: true } });
  const todayBills        = await prisma.bill.findMany({
    where: { date: { gte: todayStart, lte: todayEnd }, paymentMode: "membership" },
    include: { customer: { include: { membership: { include: { plan: true } } } }, items: { include: { service: true } } },
  });
  const employees         = await prisma.employee.findMany({ where: { isActive: true } });
  const labourGrouped     = await prisma.billItem.groupBy({
    by: ["employeeId"],
    _sum: { price: true },
    _count: { id: true },
  });
  const serviceGrouped    = await prisma.billItem.groupBy({
    by: ["serviceId"],
    _sum: { price: true },
    _count: { id: true },
    orderBy: { _sum: { price: "desc" } },
  });
  const allServices       = await prisma.service.findMany({ select: { id: true, name: true } });

  // Process last 7 days in JS
  const last7Days = last7Ranges.map(({ start, end, label }) => ({
    label,
    income: billsWeek
      .filter((b) => new Date(b.date) >= start && new Date(b.date) <= end)
      .reduce((s, b) => s + Number(b.totalAmount), 0),
    expenses: expensesWeek
      .filter((e) => new Date(e.date) >= start && new Date(e.date) <= end)
      .reduce((s, e) => s + Number(e.amount), 0),
  }));

  // Process labour income in JS
  const labourIncome = employees.map((emp) => {
    const row = labourGrouped.find((r) => r.employeeId === emp.id);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      totalServices: row?._count.id ?? 0,
      totalIncome: Number(row?._sum.price ?? 0),
    };
  });

  const activeMemberships = membershipsRaw.map((m) => ({
    id: m.id,
    customerName: m.customer.name,
    planName: m.plan.name,
    expiryDate: m.expiryDate.toISOString(),
    balance: Number(m.balance),
    totalBalance: Number(m.plan.price) * (1 + m.plan.bonusPercent / 100),
    isActive: m.isActive,
    isExpired: new Date() > m.expiryDate,
  }));

  const todayMembershipActivity = todayBills.map((b) => ({
    customerName: b.customer.name,
    planName: b.customer.membership?.plan.name ?? "Membership",
    servicesUsed: b.items.map((i) => i.service.name),
  }));

  const ti = Number(todayIncomeAgg._sum.totalAmount ?? 0);
  const te = Number(todayExpAgg._sum.amount ?? 0);
  const mi = Number(monthlyIncomeAgg._sum.totalAmount ?? 0);
  const me = Number(monthlyExpAgg._sum.amount ?? 0);
  const oi = Number(totalIncomeAgg._sum.totalAmount ?? 0);
  const oe = Number(totalExpAgg._sum.amount ?? 0);

  const serviceRevenue = serviceGrouped.map((row) => {
    const svc = allServices.find((s) => s.id === row.serviceId);
    return {
      serviceName: svc?.name ?? "Unknown",
      totalAmount: Number(row._sum.price ?? 0),
      count: row._count.id,
    };
  });

  return (
    <DashboardClient
      data={{
        today:    { income: ti, expenses: te, profit: ti - te },
        monthly:  { income: mi, expenses: me, profit: mi - me },
        overall:  { income: oi, expenses: oe, profit: oi - oe },
        totalCustomers,
        labourIncome,
        todayMembershipActivity,
        activeMemberships,
        todayBreakdown:   toBreakdown(todayBreakdownRaw),
        monthlyBreakdown: toBreakdown(monthlyBreakdownRaw),
        last7Days,
        serviceRevenue,
      }}
    />
  );
}
