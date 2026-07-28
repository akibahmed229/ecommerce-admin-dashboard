import {
    Product,
    ProductWithDetails,
    ProductVariant,
    CreateSimpleProductInput,
    CreateVariableProductInput,
    CreateVariantInput,
    ProductFilterOptions,
} from "./product.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IProductRepository {
    findById(id: string): Promise<ProductWithDetails | null>;

    findBySlug(slug: string): Promise<ProductWithDetails | null>;

    findBySku(sku: string): Promise<Product | ProductVariant | null>;

    findAll(
        options: PaginationOptions,
        filters?: ProductFilterOptions
    ): Promise<PaginatedResult<ProductWithDetails>>;

    createSimple(input: CreateSimpleProductInput): Promise<ProductWithDetails>;

    createVariable(
        input: CreateVariableProductInput
    ): Promise<ProductWithDetails>;

    update(id: string, input: Partial<Product>): Promise<Product>;

    delete(id: string): Promise<boolean>;

    // Variant operations
    addVariant(
        productId: string,
        input: CreateVariantInput
    ): Promise<ProductVariant>;

    deleteVariant(variantId: string): Promise<boolean>;
}
