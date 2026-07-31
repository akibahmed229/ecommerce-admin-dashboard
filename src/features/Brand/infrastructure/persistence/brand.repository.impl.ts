import { eq, ilike, and, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IBrandRepository } from "@features/Brand/domain/brand.repository";
import { Brand, BrandWithLogo, CreateBrandInput, UpdateBrandInput, BrandFilterOptions } from "@features/Brand/domain/brand.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";
import { brandsTable } from "./brand.schema";
import { mediaTable } from "@core/database/schema";

export class BrandRepository implements IBrandRepository {
    async findById(id: string): Promise<BrandWithLogo | null> {
        const [row] = await db.select({ brand: brandsTable, logo: mediaTable }).from(brandsTable).leftJoin(mediaTable, eq(mediaTable.id, brandsTable.logoId)).where(eq(brandsTable.id, id));
        return row ? { ...row.brand, logo: row.logo ?? null } : null;
    }

    async findBySlug(slug: string): Promise<Brand | null> {
        const [row] = await db.select().from(brandsTable).where(eq(brandsTable.slug, slug));
        return row ?? null;
    }

    async findAll(options: PaginationOptions, filters?: BrandFilterOptions): Promise<PaginatedResult<BrandWithLogo>> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (options.search) conditions.push(ilike(brandsTable.name, `%${options.search}%`));
        if (filters?.status) conditions.push(eq(brandsTable.status, filters.status));
        const whereClause = conditions.length ? and(...conditions) : undefined;

        const rows = await db.select({ brand: brandsTable, logo: mediaTable }).from(brandsTable).leftJoin(mediaTable, eq(mediaTable.id, brandsTable.logoId)).where(whereClause).limit(limit).offset(offset);
        const [{ value: total }] = await db.select({ value: count() }).from(brandsTable).where(whereClause);

        return { data: rows.map((r) => ({ ...r.brand, logo: r.logo ?? null })), total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(input: CreateBrandInput): Promise<Brand> {
        const [row] = await db.insert(brandsTable).values(input).returning();
        return row;
    }

    async update(id: string, input: UpdateBrandInput): Promise<Brand> {
        const [row] = await db.update(brandsTable).set({ ...input, updatedAt: new Date() }).where(eq(brandsTable.id, id)).returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const result = await db.delete(brandsTable).where(eq(brandsTable.id, id)).returning({ id: brandsTable.id });
        return result.length > 0;
    }

    async countAttachedProducts(_brandId: string): Promise<number> {
        return 0; // TODO tomorrow: query products.brandId once Product's schema exists
    }
}
