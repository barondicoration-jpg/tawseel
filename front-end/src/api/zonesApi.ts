import apiClient from "./client";

export interface ZoneDoc {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export const zonesApi = {
  getAll: async (): Promise<ZoneDoc[]> => {
    const res = await apiClient.get<{ status: string; zones: ZoneDoc[] }>(
      "/zones",
    );
    return res.data.zones;
  },

  create: async (name: string, description?: string): Promise<ZoneDoc> => {
    const res = await apiClient.post<{ status: string; zone: ZoneDoc }>(
      "/zones",
      {
        name,
        description,
      },
    );
    return res.data.zone;
  },

  update: async (id: string, data: Partial<ZoneDoc>): Promise<ZoneDoc> => {
    const res = await apiClient.put<{ status: string; zone: ZoneDoc }>(
      `/zones/${id}`,
      data,
    );
    return res.data.zone;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/zones/${id}`);
  },
};
