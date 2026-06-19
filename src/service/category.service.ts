import { api } from "@/lib/api";
import type { CategoryTree, CategoryType, CreateCategoryPayload, UpdateCategoryPayload } from "./category.type";

export type { CategoryTree, CategoryType, CreateCategoryPayload, UpdateCategoryPayload } from "./category.type";

export const CategoryService = {
  findAll: async (): Promise<CategoryTree[]> => {
    const response = await api.get<CategoryTree[]>("/api/category");
    return response.data;
  },

  findOne: async (id: string): Promise<CategoryType> => {
    const response = await api.get<CategoryType>(`/api/category/${id}`);
    return response.data;
  },

  create: async (payload: CreateCategoryPayload): Promise<CategoryType> => {
    const response = await api.post<CategoryType>("/api/category/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateCategoryPayload): Promise<CategoryType> => {
    const response = await api.put<CategoryType>(`/api/category/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/category/admin/${id}`);
  },
};
