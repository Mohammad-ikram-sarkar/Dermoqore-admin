import { api } from "@/lib/api";
import type { ProductType, CreateProductPayload, UpdateProductPayload } from "./product.type";

export type { ProductType, CreateProductPayload, UpdateProductPayload } from "./product.type";

type ProductListResponse = ProductType[] | { items: ProductType[] };

export const ProductService = {
  findAll: async (): Promise<ProductType[]> => {
    const response = await api.get<ProductListResponse>("/api/product");
    return Array.isArray(response.data) ? response.data : response.data.items;
  },

  findOne: async (id: string): Promise<ProductType> => {
    const response = await api.get<ProductType>(`/api/product/${id}`);
    return response.data;
  },

  create: async (payload: CreateProductPayload): Promise<ProductType> => {
    const response = await api.post<ProductType>("/api/product/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateProductPayload): Promise<ProductType> => {
    const response = await api.put<ProductType>(`/api/product/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/product/admin/${id}`);
  },
};
