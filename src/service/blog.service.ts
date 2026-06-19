import { api } from "@/lib/api";
import type { BlogType, BlogListResponse, BlogStatus, CreateBlogPayload, UpdateBlogPayload } from "./blog.type";

export type { BlogType, BlogListResponse, CreateBlogPayload, UpdateBlogPayload } from "./blog.type";

export const BlogService = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
    featured?: boolean;
    sort?: string;
  }): Promise<BlogListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.featured !== undefined) searchParams.set("featured", String(params.featured));
    if (params?.sort) searchParams.set("sort", params.sort);

    const qs = searchParams.toString();
    const response = await api.get<BlogListResponse>(`/api/blog${qs ? `?${qs}` : ""}`);
    return response.data;
  },

  findOne: async (id: string): Promise<BlogType> => {
    const response = await api.get<BlogType>(`/api/blog/${id}`);
    return response.data;
  },

  create: async (payload: CreateBlogPayload): Promise<BlogType> => {
    const response = await api.post<BlogType>("/api/blog/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateBlogPayload): Promise<BlogType> => {
    const response = await api.put<BlogType>(`/api/blog/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/blog/admin/${id}`);
  },

  toggleFeatured: async (id: string): Promise<BlogType> => {
    const response = await api.put<BlogType>(`/api/blog/admin/${id}/featured`, {});
    return response.data;
  },

  toggleStatus: async (id: string, status: BlogStatus): Promise<BlogType> => {
    const endpoint = status === "PUBLISHED" ? "publish" : "unpublish";
    const response = await api.put<BlogType>(`/api/blog/admin/${id}/${endpoint}`, {});
    return response.data;
  },

  uploadImage: async (file: File): Promise<string> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/blog/admin/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "Upload failed");
    }

    const data = await res.json() as { url: string };
    return data.url;
  },
};
