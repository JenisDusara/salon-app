import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getTodayRange, getMonthRange } from "@/lib/utils";

export default async function DashboardPage() {
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const [
    todayIncomeAgg,
    monthlyIncomeAgg,
    totalIncomeAgg,
    todayExpAgg,
    monthlyExpAgg,
    totalExpAgg,
    totalCustomers,
    employees,
  ] = await Promise.all([
    prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.bill.aggregate({ _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: todayStart, lte: todayEnd } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.customer.count(),
    prisma.employee.findMany({ where: { isActive: true } }),
  ]);

  const labourIncome = await Promise.all(
    employees.map(async (emp) => {
      const [incAgg, svcCount] = await Promise.all([
        prisma.billItem.aggregate({ _sum: { price: true }, where: { employeeId: emp.id } }),
        prisma.billItem.count({ where: { employeeId: emp.id } }),
      ]);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        totalServices: svcCount,
        totalIncome: Number(incAgg._sum.price ?? 0),
      };
    })
  );

  const todayBills = await prisma.bill.findMany({
    where: { date: { gte: todayStart, lte: todayEnd } },
    include: {
      customer: { include: { membership: { include: { plan: true } } } },
      items: { where: { isMembershipService: true }, include: { service: true } },
    },
  });

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
      }}
    />
  );
}
