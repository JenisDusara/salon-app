export const dynamic = "force-dynamic";

import { PaymentHistoryClient } from "@/components/payment-history/PaymentHistoryClient";
import { prisma } from "@/lib/prisma";

export default async function PaymentHistoryPage() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          service: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <PaymentHistoryClient
      bills={bills.map((b) => ({
        id: b.id,
        date: b.date.toISOString(),
        createdAt: b.createdAt.toISOString(),
        totalAmount: Number(b.totalAmount),
        paymentMode: b.paymentMode,
        smsSent: b.smsSent,
        customerId: b.customerId,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        items: b.items.map((i) => ({
          id: i.id,
          serviceName: i.service.name,
          employeeName: i.employee.name,
          price: Number(i.price),
          isMembershipService: i.isMembershipService,
        })),
      }))}
    />
  );
}
