import apiClient from "./client";
import type { User, Role } from "../types";

export interface CreateUserPayload {
  username: string;
  password: string;
  displayName: string;
  role: Role;
  zone?: string;
}

export interface UpdateUserPayload {
  displayName?: string;
  role?: Role;
  zone?: string;
  password?: string;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<{ status: string; users: User[] }>(
      "/users",
    );
    return res.data.users;
  },

  getDelegates: async (): Promise<User[]> => {
    const res = await apiClient.get<{ status: string; delegates: User[] }>(
      "/users/delegates",
    );
    return res.data.delegates;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await apiClient.post<{ status: string; user: User }>(
      "/users",
      payload,
    );
    return res.data.user;
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const res = await apiClient.put<{ status: string; user: User }>(
      `/users/${id}`,
      payload,
    );
    return res.data.user;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
