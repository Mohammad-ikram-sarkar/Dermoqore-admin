import { api } from "@/lib/api";
import type { BrandType, CreateBrandPayload, UpdateBrandPayload } from "./brand.type";

export type { BrandType, CreateBrandPayload, UpdateBrandPayload } from "./brand.type";

export const BrandService = {
  findAll: async (): Promise<BrandType[]> => {
    const response = await api.get<BrandType[]>("/api/brand");
    return response.data;
  },

  findOne: async (id: string): Promise<BrandType> => {
    const response = await api.get<BrandType>(`/api/brand/${id}`);
    return response.data;
  },

  create: async (payload: CreateBrandPayload): Promise<BrandType> => {
    const response = await api.post<BrandType>("/api/brand/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateBrandPayload): Promise<BrandType> => {
    const response = await api.put<BrandType>(`/api/brand/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/brand/admin/${id}`);
  },
};
