import apiClient from "./client";
import type { User } from "../types";

export interface LoginResponse {
  status: string;
  token: string;
  user: User;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<{ status: string; user: User }>("/auth/me");
    return res.data.user;
  },
};
