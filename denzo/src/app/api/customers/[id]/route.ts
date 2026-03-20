export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const customer = await prisma.customer.findUnique({
    where: { id: numId },
    include: { _count: { select: { bills: true } } },
  });
  if (!customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    createdAt: customer.createdAt.toISOString(),
    totalVisits: customer._count.bills,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const data: { name?: string; email?: string | null } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email || null;

  try {
    const customer = await prisma.customer.update({
      where: { id: numId },
      data,
      include: { _count: { select: { bills: true } } },
    });
    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
      totalVisits: customer._count.bills,
    });
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}
