export interface OrderItemType {
  id: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddressType {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  area: string | null;
  city: string;
  zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
}

export interface OrderType {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  notes: string | null;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  shippingAddressId: string | null;
  shippingAddress: ShippingAddressType | null;
  user: { id: string; name: string | null; email: string } | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  items: OrderItemType[];
  paidAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
