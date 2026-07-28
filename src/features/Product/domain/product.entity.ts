import { Category } from "@features/Category/domain/category.entity";
import { Brand } from "@features/Brand/domain/brand.entity";
import { Media } from "@features/Media/domain/media.entity";
import { AttributeValue } from "@features/Attribute/domain/attribute.entity";

export type ProductType = "simple" | "variable";

export interface ProductMediaItem {
    media: Media;
    isThumbnail: boolean;
    sortOrder: number;
}

export interface ProductVariant {
    id: string;
    productId: string;
    sku: string;
    price: string;
    salePrice: string | null;
    stockQuantity: number;
    isActive: boolean;
    attributeValues: AttributeValue[];
    media: ProductMediaItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    type: ProductType;
    sku: string | null;
    description: string | null;
    shortDescription: string | null;
    price: string | null;
    salePrice: string | null;
    stockQuantity: number | null;
    brandId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductWithDetails extends Product {
    brand?: Brand | null;
    categories: Category[];
    media: ProductMediaItem[];
    variants: ProductVariant[];
}

export interface CreateSimpleProductInput {
    name: string;
    slug: string;
    sku: string;
    description?: string;
    shortDescription?: string;
    price: number;
    salePrice?: number;
    stockQuantity?: number;
    brandId?: string;
    categoryIds: string[];
    media?: { mediaId: string; isThumbnail?: boolean; sortOrder?: number }[];
    isActive?: boolean;
}

export interface CreateVariantInput {
    sku: string;
    price: number;
    salePrice?: number;
    stockQuantity: number;
    attributeValueIds: string[];
    media?: { mediaId: string; isThumbnail?: boolean; sortOrder?: number }[];
    isActive?: boolean;
}

export interface CreateVariableProductInput {
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    brandId?: string;
    categoryIds: string[];
    media?: { mediaId: string; isThumbnail?: boolean; sortOrder?: number }[];
    variants: CreateVariantInput[];
    isActive?: boolean;
}

export interface ProductFilterOptions {
    type?: ProductType;
    brandId?: string;
    categoryId?: string;
    isActive?: boolean;
}
