import {
    Brand,
    BrandWithLogo,
    CreateBrandInput,
    UpdateBrandInput,
    BrandFilterOptions,
} from "./brand.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IBrandRepository {
    findById(id: string): Promise<BrandWithLogo | null>;

    findBySlug(slug: string): Promise<Brand | null>;

    findAll(
        options: PaginationOptions,
        filters?: BrandFilterOptions
    ): Promise<PaginatedResult<BrandWithLogo>>;

    create(input: CreateBrandInput): Promise<Brand>;

    update(id: string, input: UpdateBrandInput): Promise<Brand>;

    delete(id: string): Promise<boolean>;

    countAttachedProducts(brandId: string): Promise<number>;
}
