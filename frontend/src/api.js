import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Customers
export const getCustomers = () => API.get("/api/customers/");
export const searchCustomer = (phone) => API.get(`/api/customers/search?phone=${phone}`);
export const createCustomer = (data) => API.post("/api/customers/", data);
export const updateCustomer = (id, data) => API.put(`/api/customers/${id}`, data);
export const getCustomerHistory = (id) => API.get(`/api/customers/${id}/history`);

// Employees
export const getEmployees = () => API.get("/api/employees/");
export const createEmployee = (data) => API.post("/api/employees/", data);
export const updateEmployee = (id, data) => API.put(`/api/employees/${id}`, data);
export const getEmployeeReport = (id) => API.get(`/api/employees/${id}/report`);

// Services
export const getServices = () => API.get("/api/services/");
export const createService = (data) => API.post("/api/services/", data);
export const updateService = (id, data) => API.put(`/api/services/${id}`, data);
export const deleteService = (id) => API.delete(`/api/services/${id}`);

// Bills
export const getBills = () => API.get("/api/bills/");
export const createBill = (data) => API.post("/api/bills/", data);
export const getBill = (id) => API.get(`/api/bills/${id}`);

// Expenses
export const getExpenses = () => API.get("/api/expenses/");
export const createExpense = (data) => API.post("/api/expenses/", data);
export const updateExpense = (id, data) => API.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/api/expenses/${id}`);
export const getExpenseSummary = () => API.get("/api/expenses/summary");

// Memberships
export const getMembershipPlans = () => API.get("/api/memberships/plans");
export const createMembershipPlan = (data) => API.post("/api/memberships/plans", data);
export const updateMembershipPlan = (id, data) => API.put(`/api/memberships/plans/${id}`, data);
export const getMemberships = () => API.get("/api/memberships/");
export const createMembership = (data) => API.post("/api/memberships/", data);
export const getCustomerMembership = (customerId) => API.get(`/api/memberships/customer/${customerId}`);

// Dashboard
export const getDashboard = () => API.get("/api/dashboard/");
export const getProfit = (startDate, endDate) =>
  API.get(`/api/dashboard/profit?start_date=${startDate}&end_date=${endDate}`);

// Marketing
export const getMarketingCustomers = () => API.get("/api/marketing/customers");
export const sendBulkSMS = (message) => API.post("/api/marketing/send-sms", { message });
export const getCampaigns = () => API.get("/api/marketing/campaigns");