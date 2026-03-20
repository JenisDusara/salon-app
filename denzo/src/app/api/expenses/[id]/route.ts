import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const data: {
    category?: string;
    amount?: number;
    description?: string | null;
    date?: Date;
  } = {};
  if (body.category !== undefined) data.category = body.category;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.date !== undefined) data.date = new Date(body.date);

  try {
    const expense = await prisma.expense.update({
      where: { id: numId },
      data,
    });
    return NextResponse.json({
      id: expense.id,
      category: expense.category,
      amount: Number(expense.amount),
      description: expense.description,
      date: expense.date.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.expense.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }
}
