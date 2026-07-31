import { eq, count } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { ICategoryRepository } from "@features/Category/domain/category.repository";
import { Category, CategoryWithDetails, CategoryTreeNode, CreateCategoryInput, UpdateCategoryInput } from "@features/Category/domain/category.entity";
import { categoriesTable } from "./category.schema";
import { mediaTable } from "@core/database/schema";

export class CategoryRepository implements ICategoryRepository {
    async findById(id: string): Promise<CategoryWithDetails | null> {
        const [row] = await db.select({ category: categoriesTable, image: mediaTable }).from(categoriesTable).leftJoin(mediaTable, eq(mediaTable.id, categoriesTable.imageId)).where(eq(categoriesTable.id, id));
        if (!row) return null;
        const parent = row.category.parentId ? (await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.category.parentId)))[0] ?? null : null;
        return { ...row.category, image: row.image ?? null, parent };
    }

    async findBySlug(slug: string): Promise<Category | null> {
        const [row] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug));
        return row ?? null;
    }

    async findAllFlat(): Promise<CategoryWithDetails[]> {
        const rows = await db
            .select({ category: categoriesTable, image: mediaTable })
            .from(categoriesTable).leftJoin(mediaTable, eq(mediaTable.id, categoriesTable.imageId)).orderBy(categoriesTable.sortOrder);

        return rows.map((r) => ({ ...r.category, image: r.image ?? null }));
    }

    async findTree(): Promise<CategoryTreeNode[]> {
        const flat = await this.findAllFlat();
        const byId = new Map<string, CategoryTreeNode>();
        flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
        const roots: CategoryTreeNode[] = [];
        byId.forEach((node) => {
            if (node.parentId) {
                const parent = byId.get(node.parentId);
                (parent ? parent.children : roots).push(node); // orphan safety net if parentId points nowhere
            } else {
                roots.push(node);
            }
        });
        return roots;
    }

    async create(input: CreateCategoryInput): Promise<Category> {
        const [row] = await db.insert(categoriesTable).values(input).returning();
        return row;
    }

    async update(id: string, input: UpdateCategoryInput): Promise<Category> {
        const [row] = await db.update(categoriesTable).set({ ...input, updatedAt: new Date() }).where(eq(categoriesTable.id, id)).returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const result = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning({ id: categoriesTable.id });
        return result.length > 0;
    }

    // Walks UP from categoryId to the root, returning ancestor ids (not including itself).
    // Used to check: would setting X's parent to Y put X somewhere in Y's own ancestor chain?
    async getAncestorIds(categoryId: string): Promise<string[]> {
        const ids: string[] = [];
        let currentId: string | null = categoryId;
        const visited = new Set<string>();
        while (currentId) {
            if (visited.has(currentId)) break; // defensive — existing data shouldn't cycle, but never infinite-loop if it somehow does
            visited.add(currentId);
            const [row] = await db.select({ parentId: categoriesTable.parentId }).from(categoriesTable).where(eq(categoriesTable.id, currentId));
            if (!row?.parentId) break;
            ids.push(row.parentId);
            currentId = row.parentId;
        }
        return ids;
    }

    async countChildren(categoryId: string): Promise<number> {
        const [{ value }] = await db.select({ value: count() }).from(categoriesTable).where(eq(categoriesTable.parentId, categoryId));
        return value;
    }

    async countAttachedProducts(_categoryId: string): Promise<number> {
        return 0; // TODO tomorrow: query product_categories once Product's schema exists
    }
}
