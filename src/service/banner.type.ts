export interface ClientType {
  id: string;
  name: string;
  segment: string;
  status: string;
  avatar: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { banners: number };
  banners?: BannerType[];
}

export interface BannerType {
  id: string;
  title: string;
  tag: string;
  description?: string | null;
  imageType: string;
  device: string;
  imageUrl?: string | null;
  status: string;
  isActive: boolean;
  clientId: string;
  client: ClientType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  tag: string;
  description?: string;
  imageType: string;
  device?: string;
  imageUrl?: string;
  status?: string;
  isActive?: boolean;
  clientId: string;
}

export interface UpdateBannerPayload {
  title?: string;
  tag?: string;
  description?: string;
  imageType?: string;
  device?: string;
  imageUrl?: string;
  status?: string;
  isActive?: boolean;
  clientId?: string;
}

export interface CreateClientPayload {
  name: string;
  segment: string;
  status?: string;
  avatar: string;
  color: string;
}

export interface UpdateClientPayload {
  name?: string;
  segment?: string;
  status?: string;
  avatar?: string;
  color?: string;
}
