import { Media } from "@features/Media/domain/media.entity";

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageId: string | null;
    parentId: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryWithDetails extends Category {
    image?: Media | null;
    parent?: Category | null;
}

export interface CategoryTreeNode extends Category {
    image?: Media | null;
    children: CategoryTreeNode[];
}

export interface CreateCategoryInput {
    name: string;
    slug: string;
    description?: string;
    imageId?: string;
    parentId?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export interface UpdateCategoryInput {
    name?: string;
    slug?: string;
    description?: string;
    imageId?: string;
    parentId?: string;
    isActive?: boolean;
    sortOrder?: number;
}
