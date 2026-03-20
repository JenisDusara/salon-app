export const dynamic = "force-dynamic";

import { ServicesClient } from "@/components/services/ServicesClient";
import { prisma } from "@/lib/prisma";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } });
  return (
    <ServicesClient
      initialServices={services.map((s) => ({
        id: s.id,
        name: s.name,
        basePrice: Number(s.basePrice),
      }))}
    />
  );
}
