export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(
    expenses.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
      date: e.date.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const { category, amount, description, date } = await request.json();
  if (!category || amount === undefined)
    return NextResponse.json(
      { error: "Category and amount required" },
      { status: 400 },
    );

  try {
    const expense = await prisma.expense.create({
      data: {
        category,
        amount,
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });
    return NextResponse.json(
      {
        id: expense.id,
        category: expense.category,
        amount: Number(expense.amount),
        description: expense.description,
        date: expense.date.toISOString(),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 400 },
    );
  }
}
