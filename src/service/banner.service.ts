import { api } from "@/lib/api";
import type { BannerType, ClientType, CreateBannerPayload, UpdateBannerPayload, CreateClientPayload, UpdateClientPayload } from "./banner.type";

export type {
  BannerType,
  ClientType,
  CreateBannerPayload,
  UpdateBannerPayload,
  CreateClientPayload,
  UpdateClientPayload,
} from "./banner.type";

export const BannerService = {
  findAll: async (): Promise<BannerType[]> => {
    const response = await api.get<BannerType[]>("/api/banner");
    return response.data;
  },

  findOne: async (id: string): Promise<BannerType> => {
    const response = await api.get<BannerType>(`/api/banner/${id}`);
    return response.data;
  },

  findByClient: async (clientId: string): Promise<BannerType[]> => {
    const response = await api.get<BannerType[]>(`/api/banner/by-client/${clientId}`);
    return response.data;
  },

  create: async (payload: CreateBannerPayload): Promise<BannerType> => {
    const response = await api.post<BannerType>("/api/banner/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateBannerPayload): Promise<BannerType> => {
    const response = await api.put<BannerType>(`/api/banner/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/banner/admin/${id}`);
  },

  uploadImage: async (id: string, file: File): Promise<BannerType> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/banner/admin/upload-image/${id}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Upload failed");
    }

    return res.json();
  },
};

export const ClientService = {
  findAll: async (): Promise<ClientType[]> => {
    const response = await api.get<ClientType[]>("/api/client");
    return response.data;
  },

  findOne: async (id: string): Promise<ClientType> => {
    const response = await api.get<ClientType>(`/api/client/${id}`);
    return response.data;
  },

  create: async (payload: CreateClientPayload): Promise<ClientType> => {
    const response = await api.post<ClientType>("/api/client/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateClientPayload): Promise<ClientType> => {
    const response = await api.put<ClientType>(`/api/client/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/client/admin/${id}`);
  },
};
