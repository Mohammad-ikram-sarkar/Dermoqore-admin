export interface DeliveryChargeType {
  id: string;
  zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  charge: number;
  minOrder: number | null;
  createdAt: string;
  updatedAt: string;
}
