import { eq, ilike, or, inArray, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IMediaRepository } from "@features/Media/domain/media.repository";
import { Media, CreateMediaInput, UpdateMediaMetadataInput, MediaFilterOptions } from "@features/Media/domain/media.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";
import { and } from "drizzle-orm"; // hoist this import to the top in your actual file
import { mediaTable } from "./media.schema";
import { attributeValuesTable, brandsTable, categoriesTable } from "@core/database/schema";

export class MediaRepository implements IMediaRepository {
    async findById(id: string): Promise<Media | null> {
        const [row] = await db.select().from(mediaTable).where(eq(mediaTable.id, id));
        return row ?? null;
    }

    async findByIds(ids: string[]): Promise<Media[]> {
        if (!ids.length) return [];
        return db.select().from(mediaTable).where(inArray(mediaTable.id, ids));
    }

    async findAll(options: PaginationOptions, filters?: MediaFilterOptions): Promise<PaginatedResult<Media>> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;

        const conditions = [];
        if (options.search) conditions.push(or(ilike(mediaTable.fileName, `%${options.search}%`), ilike(mediaTable.title, `%${options.search}%`)));
        if (filters?.type) conditions.push(eq(mediaTable.type, filters.type));
        const whereClause = conditions.length ? conditions.length > 1 ? and(...conditions) : conditions[0] : undefined;

        const rows = await db.select().from(mediaTable).where(whereClause).limit(limit).offset(offset);
        const [{ value: total }] = await db.select({ value: count() }).from(mediaTable).where(whereClause);

        return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(input: CreateMediaInput): Promise<Media> {
        const [row] = await db.insert(mediaTable).values(input).returning();
        return row;
    }

    async createBatch(inputs: CreateMediaInput[]): Promise<Media[]> {
        if (!inputs.length) return [];
        return db.insert(mediaTable).values(inputs).returning();
    }

    async updateMetadata(id: string, input: UpdateMediaMetadataInput): Promise<Media> {
        const [row] = await db.update(mediaTable).set({ ...input, updatedAt: new Date() }).where(eq(mediaTable.id, id)).returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const result = await db.delete(mediaTable).where(eq(mediaTable.id, id)).returning({ id: mediaTable.id });
        return result.length > 0;
    }

    async checkUsage(id: string): Promise<{ isAttached: boolean; attachedToModule?: string }> {
        const [inBrand] = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.logoId, id)).limit(1);
        if (inBrand) return { isAttached: true, attachedToModule: "brand" };

        const [inCategory] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.imageId, id)).limit(1);
        if (inCategory) return { isAttached: true, attachedToModule: "category" };

        const [inAttrValue] = await db.select({ id: attributeValuesTable.id }).from(attributeValuesTable).where(eq(attributeValuesTable.mediaId, id)).limit(1);
        if (inAttrValue) return { isAttached: true, attachedToModule: "attribute" };

        // TODO once Product module lands: check product_media and variant_media too.
        // Until then the DB's own onDelete: "restrict" FKs are your safety net if this
        // check somehow misses a case — you'll get a 500 from the 23503 handler instead
        // of a clean 409, which is exactly why this check exists: don't ship without it.

        return { isAttached: false };
    }
}
