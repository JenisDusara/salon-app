import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateFull(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

export const EXPENSE_CATEGORIES = [
  "Salary",
  "Rent",
  "Electricity",
  "Products",
  "Coffee/Snacks",
  "Maintenance",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Salary: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Rent: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Electricity: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Products: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Coffee/Snacks": { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  Maintenance: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
  Other: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

export const SMS_TEMPLATES = [
  {
    label: "Festival Offer",
    icon: "🎉",
    text: "Festival Special! Hair Cut only Rs.99. Visit us today and look your best. Limited time offer!",
  },
  {
    label: "Weekend Offer",
    icon: "✂️",
    text: "Weekend Special! Get 20% off on all services this Saturday & Sunday. Book your slot now!",
  },
  {
    label: "New Service",
    icon: "✨",
    text: "We have added new services at our salon! Visit us to experience something new. Special intro prices available.",
  },
  {
    label: "Loyalty Message",
    icon: "💎",
    text: "Thank you for being our valued customer! Visit us this week and get a special discount just for you.",
  },
];

export function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/customers": "Customers",
    "/employees": "Employees",
    "/billing": "Billing",
    "/services": "Services",
    "/memberships": "Memberships",
    "/expenses": "Expenses",
    "/marketing": "Marketing",
  };
  return titles[pathname] ?? "Salon Pro";
}
