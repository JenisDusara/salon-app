import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { message } = await request.json();
  if (!message)
    return NextResponse.json({ error: "message is required" }, { status: 400 });

  // 1. Get all customers
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true },
  });

  const count = customers.length;

  // 2. Log SMS for each customer
  for (const customer of customers) {
    console.log(
      `[SMS] To: ${customer.phone} (${customer.name}) | Message: ${message}`
    );
  }

  // 3. Create SmsCampaign record
  const campaign = await prisma.smsCampaign.create({
    data: {
      message,
      recipientCount: count,
      sentAt: new Date(),
    },
  });

  // 4. Return result
  return NextResponse.json({
    success: true,
    sent: count,
    failed: 0,
    total: count,
    campaignId: campaign.id,
  });
}
