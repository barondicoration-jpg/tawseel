import apiClient from "./client";
import type { Order, OrderStatus } from "../types";

export interface OrderFilters {
  date?: string;
  zone?: string;
  status?: string;
  search?: string;
  delegateId?: string;
}

export interface CreateOrderPayload {
  clientName: string;
  clientPhone: string;
  address: string;
  zone: string;
  locationLink?: string;
  amount: number;
  notes?: string;
}

export interface UpdateOrderPayload {
  clientName?: string;
  clientPhone?: string;
  address?: string;
  zone?: string;
  locationLink?: string;
  amount?: number;
  collected?: number;
  status?: OrderStatus;
  delegateId?: string | null;
  notes?: string;
}

export const ordersApi = {
  getAll: async (filters?: OrderFilters): Promise<Order[]> => {
    const res = await apiClient.get<{ status: string; orders: Order[] }>(
      "/orders",
      {
        params: filters,
      },
    );
    return res.data.orders;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<{ status: string; orders: Order[] }>(
      "/orders/my-orders",
    );
    return res.data.orders;
  },

  getById: async (id: string): Promise<Order> => {
    const res = await apiClient.get<{ status: string; order: Order }>(
      `/orders/${id}`,
    );
    return res.data.order;
  },

  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await apiClient.post<{ status: string; order: Order }>(
      "/orders",
      payload,
    );
    return res.data.order;
  },

  update: async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
    const res = await apiClient.put<{ status: string; order: Order }>(
      `/orders/${id}`,
      payload,
    );
    return res.data.order;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },
};
