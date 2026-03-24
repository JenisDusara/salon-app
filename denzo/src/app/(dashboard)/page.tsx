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

  // Build last 7 days date ranges
  const last7Ranges = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    return { start, end, label };
  });

  const [
    todayIncomeAgg,
    monthlyIncomeAgg,
    totalIncomeAgg,
    todayExpAgg,
    monthlyExpAgg,
    totalExpAgg,
    totalCustomers,
    employees,
    todayBills,
    todayBreakdownRaw,
    monthlyBreakdownRaw,
  ] = await Promise.all([
    prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.bill.aggregate({
      _sum: { totalAmount: true },
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.bill.aggregate({ _sum: { totalAmount: true } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.customer.count(),
    prisma.employee.findMany({ where: { isActive: true } }),
    prisma.bill.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: {
        customer: { include: { membership: { include: { plan: true } } } },
        items: {
          where: { isMembershipService: true },
          include: { service: true },
        },
      },
    }),
    prisma.bill.groupBy({
      by: ["paymentMode"],
      _sum: { totalAmount: true },
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.bill.groupBy({
      by: ["paymentMode"],
      _sum: { totalAmount: true },
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  // Last 7 days revenue
  const last7Days = await Promise.all(
    last7Ranges.map(async ({ start, end, label }) => {
      const [incAgg, expAgg] = await Promise.all([
        prisma.bill.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: start, lte: end } },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: { date: { gte: start, lte: end } },
        }),
      ]);
      return {
        label,
        income: Number(incAgg._sum.totalAmount ?? 0),
        expenses: Number(expAgg._sum.amount ?? 0),
      };
    }),
  );

  // Labour income per employee
  const labourIncome = await Promise.all(
    employees.map(async (emp) => {
      const [incAgg, svcCount] = await Promise.all([
        prisma.billItem.aggregate({
          _sum: { price: true },
          where: { employeeId: emp.id },
        }),
        prisma.billItem.count({ where: { employeeId: emp.id } }),
      ]);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalServices: svcCount,
        totalIncome: Number(incAgg._sum.price ?? 0),
      };
    }),
  );

  const todayMembershipActivity = todayBills
    .filter((b) => b.items.length > 0)
    .map((b) => ({
      customerName: b.customer.name,
      planName: b.customer.membership?.plan.name ?? "Unknown Plan",
      servicesUsed: b.items.map((i) => i.service.name),
    }));

  const ti = Number(todayIncomeAgg._sum.totalAmount ?? 0);
  const te = Number(todayExpAgg._sum.amount ?? 0);
  const mi = Number(monthlyIncomeAgg._sum.totalAmount ?? 0);
  const me = Number(monthlyExpAgg._sum.amount ?? 0);
  const oi = Number(totalIncomeAgg._sum.totalAmount ?? 0);
  const oe = Number(totalExpAgg._sum.amount ?? 0);

  return (
    <DashboardClient
      data={{
        today: { income: ti, expenses: te, profit: ti - te },
        monthly: { income: mi, expenses: me, profit: mi - me },
        overall: { income: oi, expenses: oe, profit: oi - oe },
        totalCustomers,
        labourIncome,
        todayMembershipActivity,
        todayBreakdown: toBreakdown(todayBreakdownRaw),
        monthlyBreakdown: toBreakdown(monthlyBreakdownRaw),
        last7Days,
      }}
    />
  );
}
