import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bills: true } } },
  });
  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt.toISOString(),
      totalVisits: c._count.bills,
    })),
  );
}

export async function POST(request: Request) {
  const { name, phone, email } = await request.json();
  if (!name || !phone)
    return NextResponse.json(
      { error: "Name and phone required" },
      { status: 400 },
    );
  try {
    const customer = await prisma.customer.create({
      data: { name, phone, email: email || null },
    });
    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        createdAt: customer.createdAt.toISOString(),
        totalVisits: 0,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Phone number already exists" },
      { status: 400 },
    );
  }
}
