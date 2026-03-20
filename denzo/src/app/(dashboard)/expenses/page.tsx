import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { prisma } from "@/lib/prisma";
import { getMonthRange, getTodayRange } from "@/lib/utils";

export default async function ExpensesPage() {
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const [expenses, todayAgg, monthlyAgg, totalAgg, byCat] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["category"], _sum: { amount: true } }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of byCat)
    byCategory[row.category] = Number(row._sum.amount ?? 0);

  return (
    <ExpensesClient
      initialExpenses={expenses.map((e) => ({
        id: e.id,
        category: e.category,
        amount: Number(e.amount),
        description: e.description,
        date: e.date.toISOString(),
      }))}
      summary={{
        total: Number(totalAgg._sum.amount ?? 0),
        today: Number(todayAgg._sum.amount ?? 0),
        monthly: Number(monthlyAgg._sum.amount ?? 0),
        byCategory,
      }}
    />
  );
}
