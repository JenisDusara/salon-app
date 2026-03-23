export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // ── Fetch all data ──────────────────────────────────────────────────────────
  const [customers, employees, bills, expenses] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bills: true } },
        membership: {
          select: {
            isActive: true,
            balance: true,
            expiryDate: true,
            plan: { select: { name: true } },
          },
        },
      },
    }),
    prisma.employee.findMany({
      orderBy: { name: "asc" },
      include: {
        billItems: {
          include: { service: { select: { name: true } } },
        },
      },
    }),
    prisma.bill.findMany({
      orderBy: { date: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        items: {
          include: {
            service: { select: { name: true } },
            employee: { select: { name: true } },
          },
        },
      },
    }),
    prisma.expense.findMany({ orderBy: { date: "desc" } }),
  ]);

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Customers ──────────────────────────────────────────────────────
  const customerRows = customers.map((c) => {
    const mem = c.membership?.isActive ? c.membership : null;
    return {
      "Name": c.name,
      "Phone": c.phone,
      "Email": c.email ?? "",
      "Total Visits": c._count.bills,
      "Membership Plan": mem?.plan?.name ?? "None",
      "Membership Balance (₹)": mem ? Number(mem.balance) : "",
      "Membership Expiry": mem
        ? new Date(mem.expiryDate).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          })
        : "",
      "Joined Date": new Date(c.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
    };
  });

  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  wsCustomers["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 12 },
    { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers");

  // ── Sheet 2: Employees ──────────────────────────────────────────────────────
  const employeeRows = employees.map((e) => {
    const totalIncome = e.billItems.reduce((s, i) => s + Number(i.price), 0);
    const totalServices = e.billItems.length;

    // Count per service type
    const serviceMap: Record<string, number> = {};
    for (const item of e.billItems) {
      const name = item.service.name;
      serviceMap[name] = (serviceMap[name] ?? 0) + 1;
    }
    const serviceBreakdown = Object.entries(serviceMap)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    return {
      "Name": e.name,
      "Phone": e.phone,
      "Joined Date": new Date(e.joinedDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
      "Status": e.isActive ? "Active" : "Inactive",
      "Total Services Done": totalServices,
      "Total Revenue (₹)": totalIncome,
      "Service Breakdown": serviceBreakdown,
    };
  });

  const wsEmployees = XLSX.utils.json_to_sheet(employeeRows);
  wsEmployees["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 20 }, { wch: 18 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsEmployees, "Employees");

  // ── Sheet 3: Bills ──────────────────────────────────────────────────────────
  const billRows: Record<string, string | number>[] = [];
  for (const bill of bills) {
    for (const item of bill.items) {
      billRows.push({
        "Bill ID": bill.id,
        "Date": new Date(bill.date).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        }),
        "Customer Name": bill.customer.name,
        "Customer Phone": bill.customer.phone,
        "Service": item.service.name,
        "Employee": item.employee.name,
        "Price (₹)": Number(item.price),
        "Membership Service": item.isMembershipService ? "Yes" : "No",
        "Payment Mode": bill.paymentMode,
        "Bill Total (₹)": Number(bill.totalAmount),
      });
    }
  }

  const wsBills = XLSX.utils.json_to_sheet(billRows);
  wsBills["!cols"] = [
    { wch: 8 }, { wch: 14 }, { wch: 22 }, { wch: 14 },
    { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 18 },
    { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBills, "Bills");

  // ── Sheet 4: Expenses ────────────────────────────────────────────────────────
  const expenseRows = expenses.map((e) => ({
    "Date": new Date(e.date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }),
    "Category": e.category,
    "Description": e.description ?? "",
    "Amount (₹)": Number(e.amount),
  }));

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  expenseRows.push({ "Date": "", "Category": "", "Description": "TOTAL", "Amount (₹)": totalExpense });

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  wsExpenses["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 30 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

  // ── Write & return ──────────────────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }).replace(/ /g, "-");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Denzo-Report-${today}.xlsx"`,
    },
  });
}
