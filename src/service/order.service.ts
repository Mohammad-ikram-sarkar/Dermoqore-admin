import { api } from "@/lib/api";
import type { OrderType, PaginatedResponse } from "./order.type";

export type { OrderType } from "./order.type";

export const OrderService = {
  findAll: async (page = 1, limit = 20): Promise<PaginatedResponse<OrderType>> => {
    const response = await api.get<PaginatedResponse<OrderType>>(`/api/order/admin?page=${page}&limit=${limit}`);
    return response.data;
  },

  findByZone: async (zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA", page = 1, limit = 20): Promise<PaginatedResponse<OrderType>> => {
    const response = await api.get<PaginatedResponse<OrderType>>(`/api/order/admin/${zone === "INSIDE_DHAKA" ? "inside-dhaka" : "outside-dhaka"}?page=${page}&limit=${limit}`);
    return response.data;
  },

  findOne: async (id: string): Promise<OrderType> => {
    const response = await api.get<OrderType>(`/api/order/admin/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<OrderType> => {
    const response = await api.put<OrderType>(`/api/order/admin/${id}/status`, { status });
    return response.data;
  },
};
