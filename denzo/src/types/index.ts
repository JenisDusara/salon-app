export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  totalVisits: number;
}

export interface Employee {
  id: number;
  name: string;
  phone: string;
  joinedDate: string;
  isActive: boolean;
}

export interface Service {
  id: number;
  name: string;
  basePrice: number;
}

export interface BillItemData {
  id: number;
  serviceId: number;
  serviceName: string | null;
  employeeId: number;
  employeeName: string | null;
  price: number;
  isMembershipService: boolean;
}

export interface Bill {
  id: number;
  customerId: number;
  customerName: string | null;
  date: string;
  totalAmount: number;
  smsSent: boolean;
  items: BillItemData[];
}

export interface MembershipPlanServiceItem {
  serviceId: number;
  serviceName: string;
  allowedCount: number;
}

export interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  validityDays: number;
  isActive: boolean;
  services: MembershipPlanServiceItem[];
}

export interface MembershipServiceUsage {
  serviceId: number;
  serviceName: string;
  allowed: number;
  used: number;
  remaining: number;
}

export interface Membership {
  id: number;
  customerId: number;
  customerName: string | null;
  planId: number;
  planName: string | null;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  isExpired: boolean;
  services: MembershipServiceUsage[];
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

export interface ExpenseSummary {
  total: number;
  today: number;
  monthly: number;
  byCategory: Record<string, number>;
}

export interface LabourIncome {
  employeeId: number;
  employeeName: string;
  totalServices: number;
  totalIncome: number;
}

export interface MembershipActivity {
  customerName: string;
  planName: string;
  servicesUsed: string[];
}

export interface PeriodStats {
  income: number;
  expenses: number;
  profit: number;
}

export interface DashboardData {
  today: PeriodStats;
  monthly: PeriodStats;
  overall: PeriodStats;
  totalCustomers: number;
  labourIncome: LabourIncome[];
  todayMembershipActivity: MembershipActivity[];
}

export interface SmsCampaign {
  id: number;
  message: string;
  sentAt: string;
  recipientCount: number;
}

export interface CustomerHistory {
  customer: Customer;
  totalVisits: number;
  bills: Bill[];
}

export interface EmployeeReport {
  employee: Employee;
  totalServices: number;
  totalIncome: number;
  serviceHistory: Array<{
    date: string;
    serviceName: string;
    customerName: string;
    price: number;
  }>;
}
