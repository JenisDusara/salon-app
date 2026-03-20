import { MarketingClient } from "@/components/marketing/MarketingClient";
import { prisma } from "@/lib/prisma";

export default async function MarketingPage() {
  const [customers, campaigns] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true, phone: true } }),
    prisma.smsCampaign.findMany({ orderBy: { sentAt: "desc" }, take: 20 }),
  ]);

  return (
    <MarketingClient
      customerCount={customers.length}
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        message: c.message,
        sentAt: c.sentAt.toISOString(),
        recipientCount: c.recipientCount,
      }))}
    />
  );
}
