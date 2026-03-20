import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("start_date");
  const endDateParam = searchParams.get("end_date");

  if (!startDateParam || !endDateParam)
    return NextResponse.json(
      { error: "start_date and end_date query parameters are required (YYYY-MM-DD)" },
      { status: 400 }
    );

  const startDate = new Date(`${startDateParam}T00:00:00.000Z`);
  const endDate = new Date(`${endDateParam}T23:59:59.999Z`);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });

  const [bills, expenses] = await Promise.all([
    prisma.bill.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { amount: true },
    }),
  ]);

  const income = bills.reduce((s, b) => s + Number(b.totalAmount), 0);
  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = income - expensesTotal;

  return NextResponse.json({
    startDate: startDateParam,
    endDate: endDateParam,
    income,
    expenses: expensesTotal,
    profit,
  });
}
