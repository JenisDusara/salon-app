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

  const employee = await prisma.employee.findUnique({
    where: { id: numId },
  });
  if (!employee)
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  return NextResponse.json({
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    joinedDate: employee.joinedDate.toISOString().split("T")[0],
    isActive: employee.isActive,
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
  const data: {
    name?: string;
    phone?: string;
    isActive?: boolean;
    joinedDate?: Date;
  } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.joinedDate !== undefined)
    data.joinedDate = new Date(body.joinedDate);

  try {
    const employee = await prisma.employee.update({
      where: { id: numId },
      data,
    });
    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      joinedDate: employee.joinedDate.toISOString().split("T")[0],
      isActive: employee.isActive,
    });
  } catch {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
}
