export type Role = "admin" | "supervisor" | "delegate" | "viewer";

export interface User {
  id: string; // maps to _id from API
  username: string;
  role: Role;
  displayName: string;
  zone?: string | null;
}

export type OrderStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "returned"
  | "partial";

export interface Order {
  id: string; // maps to _id from API
  clientName: string;
  clientPhone: string;
  address: string;
  zone: string;
  locationLink: string;
  amount: number;
  collected: number;
  status: OrderStatus;
  delegateId?: string | null;
  delegate?: User | null; // populated by API
  notes: string;
  createdAt: string; // ISO date string
  updatedAt: string;
  dailySeq: number;
  date: string; // YYYY-MM-DD
}

export interface DelegateProgress {
  delegateId: string;
  currentLocation: string;
  completedOrders: number;
  totalOrders: number;
  lastUpdate: string;
}

// Fallback static zones — used when API is unavailable
export const DEFAULT_ZONES = [
  "التجمع الأول",
  "التجمع الثالث",
  "التجمع الخامس",
  "الرحاب",
] as const;

// For backward-compat usage where static ZONES array is still referenced
export const ZONES = DEFAULT_ZONES as unknown as string[];

export type Zone = (typeof DEFAULT_ZONES)[number];
