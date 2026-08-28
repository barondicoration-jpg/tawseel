import apiClient from "./client";
import type { User } from "../types";

export interface DelegateProgressEntry {
  delegate: User;
  currentLocation: string;
  lastUpdate: string | null;
  stats: {
    totalOrders: number;
    delivered: number;
    returned: number;
    inTransit: number;
    pending: number;
    collected: number;
  };
}

export const delegatesApi = {
  getProgress: async (date?: string): Promise<DelegateProgressEntry[]> => {
    const res = await apiClient.get<{
      status: string;
      progress: DelegateProgressEntry[];
    }>("/delegates/progress", { params: date ? { date } : {} });
    return res.data.progress;
  },

  updateMyProgress: async (currentLocation: string): Promise<void> => {
    await apiClient.put("/delegates/progress", { currentLocation });
  },

  updateDelegateLocation: async (
    delegateId: string,
    currentLocation: string,
  ): Promise<void> => {
    await apiClient.put(`/delegates/${delegateId}/location`, {
      currentLocation,
    });
  },
};
