import { eq } from "drizzle-orm";
import { db } from "@core/database/drizzle-client";
import { IAttributeRepository } from "@features/Attribute/domain/attribute.repository";
import { Attribute, AttributeValue, AttributeWithValues, CreateAttributeInput, UpdateAttributeInput, CreateAttributeValueInput, UpdateAttributeValueInput } from "@features/Attribute/domain/attribute.entity";
import { attributesTable, attributeValuesTable } from "./attribute.schema";
import { mediaTable } from "@core/database/schema";

export class AttributeRepository implements IAttributeRepository {
    private async loadValues(attributeId: string): Promise<AttributeValue[]> {
        const rows = await db.select({ av: attributeValuesTable, mediaTable }).from(attributeValuesTable).leftJoin(mediaTable, eq(mediaTable.id, attributeValuesTable.mediaId)).where(eq(attributeValuesTable.attributeId, attributeId));
        return rows.map((r) => ({ ...r.av, media: r.mediaTable ?? null }));
    }

    async findById(id: string): Promise<AttributeWithValues | null> {
        const [attribute] = await db.select().from(attributesTable).where(eq(attributesTable.id, id));
        if (!attribute) return null;
        return { ...attribute, values: await this.loadValues(id) };
    }

    async findBySlug(slug: string): Promise<Attribute | null> {
        const [row] = await db.select().from(attributesTable).where(eq(attributesTable.slug, slug));
        return row ?? null;
    }

    async findAll(): Promise<AttributeWithValues[]> {
        const all = await db.select().from(attributesTable);
        const result: AttributeWithValues[] = [];
        for (const attribute of all) result.push({ ...attribute, values: await this.loadValues(attribute.id) });
        return result;
    }

    async create(input: CreateAttributeInput): Promise<Attribute> {
        const [row] = await db.insert(attributesTable).values(input).returning();
        return row;
    }

    async update(id: string, input: UpdateAttributeInput): Promise<Attribute> {
        const [row] = await db.update(attributesTable).set({ ...input, updatedAt: new Date() }).where(eq(attributesTable.id, id)).returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const result = await db.delete(attributesTable).where(eq(attributesTable.id, id)).returning({ id: attributesTable.id });
        return result.length > 0;
    }

    async findValueById(valueId: string): Promise<AttributeValue | null> {
        const [row] = await db.select().from(attributeValuesTable).where(eq(attributeValuesTable.id, valueId));
        return row ?? null;
    }

    async addValue(attributeId: string, input: CreateAttributeValueInput): Promise<AttributeValue> {
        const [row] = await db.insert(attributeValuesTable).values({ attributeId, ...input }).returning();
        return row;
    }

    async updateValue(valueId: string, input: UpdateAttributeValueInput): Promise<AttributeValue> {
        const [row] = await db.update(attributeValuesTable).set({ ...input, updatedAt: new Date() }).where(eq(attributeValuesTable.id, valueId)).returning();
        return row;
    }

    async deleteValue(valueId: string): Promise<boolean> {
        const result = await db.delete(attributeValuesTable).where(eq(attributeValuesTable.id, valueId)).returning({ id: attributeValuesTable.id });
        return result.length > 0;
    }

    async countVariantsUsingValue(_valueId: string): Promise<number> {
        return 0; // TODO tomorrow: query variant_attribute_values once Product's schema exists
    }
}
