export interface ProductImageType {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface IngredientType {
  id: string;
  name: string;
  percentage: string | null;
}

export interface ProductUsageType {
  id: string;
  stepNumber: number;
  content: string;
}

export interface ProductBenefitType {
  id: string;
  title: string;
}

export interface ProductSEOType {
  id: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  skinType: string | null;
  status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  categoryId: string;
  brandId: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  images: ProductImageType[];
  ingredients: IngredientType[];
  howToUse: ProductUsageType[];
  benefits: ProductBenefitType[];
  seo: ProductSEOType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  comparePrice?: number;
  stock?: number;
  skinType?: string;
  status?: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  categoryId: string;
  brandId?: string;
  images?: Omit<ProductImageType, "id">[];
  ingredients?: Omit<IngredientType, "id">[];
  howToUse?: Omit<ProductUsageType, "id">[];
  benefits?: Omit<ProductBenefitType, "id">[];
  seo?: Omit<ProductSEOType, "id">;
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  skinType?: string;
  status?: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  categoryId?: string;
  brandId?: string;
  images?: Omit<ProductImageType, "id">[];
  ingredients?: Omit<IngredientType, "id">[];
  howToUse?: Omit<ProductUsageType, "id">[];
  benefits?: Omit<ProductBenefitType, "id">[];
  seo?: Omit<ProductSEOType, "id">;
}
