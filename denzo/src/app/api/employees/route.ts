import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(
    employees.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      joinedDate: e.joinedDate.toISOString().split("T")[0],
      isActive: e.isActive,
    }))
  );
}

export async function POST(request: Request) {
  const { name, phone, joinedDate } = await request.json();
  if (!name || !phone)
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  try {
    const employee = await prisma.employee.create({
      data: {
        name,
        phone,
        joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
      },
    });
    return NextResponse.json(
      {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        joinedDate: employee.joinedDate.toISOString().split("T")[0],
        isActive: employee.isActive,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 400 });
  }
}
