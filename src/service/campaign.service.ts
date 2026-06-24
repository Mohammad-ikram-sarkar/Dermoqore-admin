import { api } from "@/lib/api";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "ENDED";
export type CampaignOrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type WhySection = { heading: string; items: string[] };
export type Testimonial = { name: string; location?: string; text: string };

export interface CampaignImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: { url: string; alt?: string }[];
  };
  heroImages: CampaignImage[];
  videoUrl?: string;
  videoTitle?: string;
  campaignPrice?: number;
  comparePrice?: number;
  whySections?: WhySection[];
  benefits?: string[];
  testimonials?: Testimonial[];
  included?: string[];
  offerBadge?: string;
  ctaText?: string;
  phoneNumber?: string;
  formTitle?: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignOrder {
  id: string;
  orderNumber: string;
  campaignId: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  quantity: number;
  unitPrice: number;
  shippingCharge: number;
  total: number;
  status: CampaignOrderStatus;
  notes?: string;
  createdAt: string;
  campaign?: { title: string; slug: string };
}

export type CreateCampaignPayload = {
  title: string;
  slug?: string;
  subtitle?: string;
  productId: string;
  videoUrl?: string;
  videoTitle?: string;
  campaignPrice?: number;
  comparePrice?: number;
  whySections?: WhySection[];
  benefits?: string[];
  testimonials?: Testimonial[];
  included?: string[];
  offerBadge?: string;
  ctaText?: string;
  phoneNumber?: string;
  formTitle?: string;
  status?: CampaignStatus;
  images?: { url: string; alt?: string; sortOrder?: number }[];
};

export const CampaignService = {
  findAll: async (): Promise<Campaign[]> => {
    const { data } = await api.get<Campaign[]>("/api/campaign/admin");
    return data;
  },

  findById: async (id: string): Promise<Campaign> => {
    const { data } = await api.get<Campaign>(`/api/campaign/admin/${id}`);
    return data;
  },

  create: async (payload: CreateCampaignPayload): Promise<Campaign> => {
    const { data } = await api.post<Campaign>("/api/campaign/admin", payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> => {
    const { data } = await api.put<Campaign>(`/api/campaign/admin/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/campaign/admin/${id}`);
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch("/api/campaign/admin/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Image upload failed");
    return res.json();
  },

  getOrders: async (campaignId: string, page = 1): Promise<{ items: CampaignOrder[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await api.get(`/api/campaign/admin/${campaignId}/orders?page=${page}`);
    return data as any;
  },

  getAllOrders: async (page = 1, status?: string, phone?: string): Promise<{ items: CampaignOrder[]; meta: { page: number; limit: number; total: number; totalPages: number } }> => {
    const params = new URLSearchParams({ page: String(page) })
    if (status) params.set('status', status)
    if (phone) params.set('phone', phone)
    const { data } = await api.get(`/api/campaign/admin/orders?${params}`);
    return data as any;
  },

  getOrderById: async (orderId: string): Promise<CampaignOrder> => {
    const { data } = await api.get<CampaignOrder>(`/api/campaign/admin/orders/${orderId}`);
    return data;
  },

  updateOrderStatus: async (orderId: string, status: CampaignOrderStatus): Promise<CampaignOrder> => {
    const { data } = await api.put<CampaignOrder>(`/api/campaign/admin/orders/${orderId}/status`, { status });
    return data;
  },
};
