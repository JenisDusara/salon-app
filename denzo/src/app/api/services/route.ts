import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      basePrice: Number(s.basePrice),
    }))
  );
}

export async function POST(request: Request) {
  const { name, basePrice } = await request.json();
  if (!name || basePrice === undefined)
    return NextResponse.json({ error: "Name and basePrice required" }, { status: 400 });
  try {
    const service = await prisma.service.create({
      data: { name, basePrice },
    });
    return NextResponse.json(
      {
        id: service.id,
        name: service.name,
        basePrice: Number(service.basePrice),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create service" }, { status: 400 });
  }
}
