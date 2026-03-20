export const dynamic = "force-dynamic";

import { CustomersClient } from "@/components/customers/CustomersClient";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bills: true } } },
  });
  return (
    <CustomersClient
      initialCustomers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        createdAt: c.createdAt.toISOString(),
        totalVisits: c._count.bills,
      }))}
    />
  );
}
