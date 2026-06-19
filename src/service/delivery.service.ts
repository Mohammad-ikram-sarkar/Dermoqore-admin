import { api } from "@/lib/api";
import type { DeliveryChargeType } from "./delivery.type";

export type { DeliveryChargeType } from "./delivery.type";

export const DeliveryService = {
  findAll: async (): Promise<DeliveryChargeType[]> => {
    const response = await api.get<DeliveryChargeType[]>("/api/delivery");
    return response.data;
  },

  update: async (id: string, payload: { charge: number; minOrder?: number | null }): Promise<DeliveryChargeType> => {
    const response = await api.put<DeliveryChargeType>(`/api/delivery/admin/${id}`, payload);
    return response.data;
  },
};
