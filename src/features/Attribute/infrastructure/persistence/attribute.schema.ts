import { mediaTable } from "@core/database/schema";
import { attributeTypeEnum } from "@core/database/schema/enums";
import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const attributesTable = pgTable("attributes", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    type: attributeTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attributeValuesTable = pgTable(
    "attribute_values",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        attributeId: uuid("attribute_id")
            .notNull()
            .references(() => attributesTable.id, { onDelete: "cascade" }),
        value: varchar("value", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 255 }).notNull(),
        hexCode: varchar("hex_code", { length: 7 }), // For colour_swatch (e.g. #FF0000)
        mediaId: uuid("media_id").references(() => mediaTable.id, { onDelete: "restrict" }), // For image_swatch
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        // Value and slug must be unique WITHIN an attribute
        attrValUnq: uniqueIndex("attr_val_unique_idx").on(table.attributeId, table.value),
        attrSlugUnq: uniqueIndex("attr_slug_unique_idx").on(table.attributeId, table.slug),
    })
);
