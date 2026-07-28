import { Media } from "@features/Media/domain/media.entity";

export type BrandStatus = "active" | "inactive";

export interface Brand {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoId: string | null;
    status: BrandStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface BrandWithLogo extends Brand {
    logo?: Media | null;
}

export interface CreateBrandInput {
    name: string;
    slug: string;
    description?: string;
    logoId?: string;
    status?: BrandStatus;
}

export interface UpdateBrandInput {
    name?: string;
    slug?: string;
    description?: string;
    logoId?: string;
    status?: BrandStatus;
}

export interface BrandFilterOptions {
    status?: BrandStatus;
}
