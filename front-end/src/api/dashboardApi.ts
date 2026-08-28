import apiClient from "./client";
import type { User } from "../types";

export interface DashboardStats {
  date: string;
  totalToday: number;
  delivered: number;
  returned: number;
  pending: number;
  inTransit: number;
  assigned: number;
  partial: number;
  totalCollected: number;
  totalAmount: number;
}

export interface DelegateCollection {
  delegate: User;
  totalOrders: number;
  delivered: number;
  returned: number;
  totalAmount: number;
  totalCollected: number;
}

export const dashboardApi = {
  getStats: async (date?: string): Promise<DashboardStats> => {
    const res = await apiClient.get<{ status: string; stats: DashboardStats }>(
      "/dashboard/stats",
      {
        params: date ? { date } : {},
      },
    );
    return res.data.stats;
  },

  getCollections: async (date?: string): Promise<DelegateCollection[]> => {
    const res = await apiClient.get<{
      status: string;
      collections: DelegateCollection[];
    }>("/dashboard/collections", { params: date ? { date } : {} });
    return res.data.collections;
  },
};
