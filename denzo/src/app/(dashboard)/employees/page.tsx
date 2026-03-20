export const dynamic = "force-dynamic";

import { EmployeesClient } from "@/components/employees/EmployeesClient";
import { prisma } from "@/lib/prisma";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });
  return (
    <EmployeesClient
      initialEmployees={employees.map((e) => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        joinedDate: e.joinedDate.toISOString().split("T")[0],
        isActive: e.isActive,
      }))}
    />
  );
}
