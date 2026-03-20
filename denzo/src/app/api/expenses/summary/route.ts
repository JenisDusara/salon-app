export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  // Today: midnight to end of day
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

  // Current month: first day to last day
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

  const [allExpenses, todayExpenses, monthlyExpenses] = await Promise.all([
    prisma.expense.findMany(),
    prisma.expense.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.expense.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  const total = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const today = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthly = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const e of allExpenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
  }

  return NextResponse.json({ total, today, monthly, byCategory });
}
