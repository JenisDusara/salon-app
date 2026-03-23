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

  const service = await prisma.service.findUnique({ where: { id: numId } });
  if (!service)
    return NextResponse.json({ error: "Service not found" }, { status: 404 });

  return NextResponse.json({
    id: service.id,
    name: service.name,
    basePrice: Number(service.basePrice),
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
  const data: { name?: string; basePrice?: number } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.basePrice !== undefined) data.basePrice = body.basePrice;

  try {
    const service = await prisma.service.update({
      where: { id: numId },
      data,
    });
    return NextResponse.json({
      id: service.id,
      name: service.name,
      basePrice: Number(service.basePrice),
    });
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const billCount = await prisma.billItem.count({ where: { serviceId: numId } });
    if (billCount > 0)
      return NextResponse.json(
        { error: `Cannot delete — this service is used in ${billCount} bill(s)` },
        { status: 400 },
      );

    await prisma.service.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}
