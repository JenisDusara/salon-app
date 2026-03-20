export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") || "";
  if (!phone) return NextResponse.json({ found: false, customer: null });
  const customer = await prisma.customer.findFirst({
    where: { phone: { contains: phone } },
    include: { _count: { select: { bills: true } } },
  });
  if (!customer) return NextResponse.json({ found: false, customer: null });
  return NextResponse.json({
    found: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalVisits: customer._count.bills,
      createdAt: customer.createdAt.toISOString(),
    },
  });
}
