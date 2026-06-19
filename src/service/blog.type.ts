export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogType {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: any;
  featuredImage: string | null;
  status: BlogStatus;
  featured: boolean;
  categoryId: string;
  authorId: string;
  category: BlogCategory;
  author: BlogAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  data: BlogType[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateBlogPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  status?: BlogStatus;
  featured?: boolean;
  categoryId: string;
}

export interface UpdateBlogPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  status?: BlogStatus;
  featured?: boolean;
  categoryId?: string;
}
