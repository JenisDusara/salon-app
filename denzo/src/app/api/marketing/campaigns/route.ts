import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const campaigns = await prisma.smsCampaign.findMany({
    orderBy: { sentAt: "desc" },
  });
  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      message: c.message,
      recipientCount: c.recipientCount,
      sentAt: c.sentAt.toISOString(),
    }))
  );
}
