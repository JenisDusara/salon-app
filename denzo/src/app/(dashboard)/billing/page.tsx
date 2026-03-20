import { prisma } from "@/lib/prisma";
import { BillingClient } from "@/components/billing/BillingClient";

export default async function BillingPage() {
  const [services, employees, recentBills, customers] = await Promise.all([
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.bill.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: { include: { service: true, employee: true } },
      },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <BillingClient
      services={services.map((s) => ({ id: s.id, name: s.name, basePrice: Number(s.basePrice) }))}
      employees={employees.map((e) => ({ id: e.id, name: e.name, phone: e.phone, joinedDate: e.joinedDate.toISOString(), isActive: e.isActive }))}
      recentBills={recentBills.map((b) => ({
        id: b.id, customerId: b.customerId, customerName: b.customer.name,
        date: b.date.toISOString(), totalAmount: Number(b.totalAmount), smsSent: b.smsSent,
        items: b.items.map((i) => ({
          id: i.id, serviceId: i.serviceId, serviceName: i.service.name,
          employeeId: i.employeeId, employeeName: i.employee.name,
          price: Number(i.price), isMembershipService: i.isMembershipService,
        })),
      }))}
      allCustomers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, createdAt: c.createdAt.toISOString(), totalVisits: 0 }))}
    />
  );
}
