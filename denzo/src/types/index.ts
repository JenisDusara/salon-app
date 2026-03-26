export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  totalVisits: number;
  membershipBalance?: number;
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
  paymentMode: string;
  items: BillItemData[];
}

export interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  bonusPercent: number;
  validityDays: number;
  isActive: boolean;
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
  balance: number;
  totalBalance: number;
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

export interface DashboardMembership {
  id: number;
  customerName: string;
  planName: string;
  expiryDate: string;
  balance: number;
  totalBalance: number;
  isActive: boolean;
  isExpired: boolean;
}

export interface PeriodStats {
  income: number;
  expenses: number;
  profit: number;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  online: number;
  membership: number;
}

export interface DayRevenue {
  label: string;
  income: number;
  expenses: number;
}

export interface ServiceRevenue {
  serviceName: string;
  totalAmount: number;
  count: number;
}

export interface DashboardData {
  today: PeriodStats;
  monthly: PeriodStats;
  overall: PeriodStats;
  totalCustomers: number;
  labourIncome: LabourIncome[];
  todayMembershipActivity: MembershipActivity[];
  activeMemberships: DashboardMembership[];
  todayBreakdown: PaymentBreakdown;
  monthlyBreakdown: PaymentBreakdown;
  last7Days: DayRevenue[];
  serviceRevenue: ServiceRevenue[];
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
