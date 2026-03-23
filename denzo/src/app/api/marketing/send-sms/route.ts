export const dynamic = "force-dynamic";

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

  if (customers.length === 0)
    return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 });

  const apiKey = process.env.FAST2SMS_API_KEY;
  let sent = 0;
  let failed = 0;

  if (apiKey) {
    // Fast2SMS bulk — send all numbers in one API call (comma-separated)
    const numbers = customers.map((c) => c.phone).join(",");
    try {
      const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message,
          language: "english",
          flash: 0,
          numbers,
        }),
      });
      const smsData = await smsRes.json();
      if (smsData.return) {
        sent = customers.length;
        console.log("[Marketing SMS] Bulk sent. Request ID:", smsData.request_id);
      } else {
        failed = customers.length;
        console.error("[Marketing SMS] Fast2SMS error:", smsData);
      }
    } catch (err) {
      failed = customers.length;
      console.error("[Marketing SMS] Failed:", err);
    }
  } else {
    console.warn("[Marketing SMS] FAST2SMS_API_KEY not set");
    failed = customers.length;
  }

  // Create SmsCampaign record
  const campaign = await prisma.smsCampaign.create({
    data: {
      message,
      recipientCount: sent,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({
    success: sent > 0,
    sent,
    failed,
    total: customers.length,
    campaignId: campaign.id,
  });
}
