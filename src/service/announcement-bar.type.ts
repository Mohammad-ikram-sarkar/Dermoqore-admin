export interface AnnouncementBarType {
  id: string;
  message: string;
  link: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAnnouncementBarPayload {
  message: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateAnnouncementBarPayload {
  message?: string;
  link?: string;
  order?: number;
  isActive?: boolean;
}
