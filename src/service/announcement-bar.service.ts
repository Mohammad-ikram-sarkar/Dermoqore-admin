import { api } from "@/lib/api";
import type {
  AnnouncementBarType,
  CreateAnnouncementBarPayload,
  UpdateAnnouncementBarPayload,
} from "./announcement-bar.type";

export type { AnnouncementBarType, CreateAnnouncementBarPayload, UpdateAnnouncementBarPayload } from "./announcement-bar.type";

export const AnnouncementBarService = {
  findAll: async (): Promise<AnnouncementBarType[]> => {
    const response = await api.get<AnnouncementBarType[]>("/api/announcement-bar");
    return response.data;
  },

  findOne: async (id: string): Promise<AnnouncementBarType> => {
    const response = await api.get<AnnouncementBarType>(`/api/announcement-bar/${id}`);
    return response.data;
  },

  create: async (payload: CreateAnnouncementBarPayload): Promise<AnnouncementBarType> => {
    const response = await api.post<AnnouncementBarType>("/api/announcement-bar/admin", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateAnnouncementBarPayload): Promise<AnnouncementBarType> => {
    const response = await api.put<AnnouncementBarType>(`/api/announcement-bar/admin/${id}`, payload);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/announcement-bar/admin/${id}`);
  },
};
