export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  createdAt: string;
}

export interface OfferItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Offer {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  total: number;
  createdAt: string;
  validUntil: string;
  items: OfferItem[];
}

export interface Project {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  status: "active" | "completed" | "paused";
  startDate: string;
  endDate?: string;
  description: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  userId: string;
  date: string;
  hours: number;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  company: string;
  photoURL?: string;
}

export interface DashboardStats {
  customerCount: number;
  customerLimit: number;
  offerCount: number;
  offerLimit: number;
  projectCount: number;
  projectLimit: number;
  hoursThisWeek: number;
  openOfferValue: number;
}
