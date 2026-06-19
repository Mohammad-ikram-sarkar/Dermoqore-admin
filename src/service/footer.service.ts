import { api } from "@/lib/api";
import type { FooterType, CreateFooterPayload, UpdateFooterPayload } from "./footer.type";

export type { FooterType, FooterSocial, FooterSection, FooterLink, CreateFooterPayload, UpdateFooterPayload } from "./footer.type";

export const FooterService = {
  findAll: async (): Promise<FooterType[]> => {
    const response = await api.get<FooterType[]>("/api/footer");
    return response.data;
  },

  findOne: async (id: string): Promise<FooterType> => {
    const response = await api.get<FooterType>(`/api/footer/${id}`);
    return response.data;
  },

  create: async (payload: CreateFooterPayload): Promise<FooterType> => {
    const response = await api.post<FooterType>("/api/footer/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateFooterPayload): Promise<FooterType> => {
    const response = await api.put<FooterType>(`/api/footer/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/footer/admin/${id}`);
  },

  uploadLogo: async (id: string, file: File): Promise<FooterType> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/footer/admin/upload-logo/${id}`, {
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
