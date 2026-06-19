export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: CategoryType;
  children?: CategoryType[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends CategoryType {
  children: CategoryTree[];
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  parentId?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  parentId?: string;
}
