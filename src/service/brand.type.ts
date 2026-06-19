export interface BrandType {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  products: { id: string }[];
  createdAt: string;
}

export interface CreateBrandPayload {
  name: string;
  slug?: string;
}

export interface UpdateBrandPayload {
  name?: string;
  slug?: string;
}
