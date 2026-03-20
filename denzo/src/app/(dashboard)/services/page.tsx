import { prisma } from "@/lib/prisma";
import { ServicesClient } from "@/components/services/ServicesClient";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } });
  return (
    <ServicesClient
      initialServices={services.map((s) => ({ id: s.id, name: s.name, basePrice: Number(s.basePrice) }))}
    />
  );
}
