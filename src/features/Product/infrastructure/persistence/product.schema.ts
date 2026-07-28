import { productTypeEnum } from "@core/database/schema/enums";
import { attributeValuesTable } from "@features/Attribute/infrastructure/persistence/attribute.schema";
import { brandsTable } from "@features/Brand/infrastructure/persistence/brand.schema";
import { categoriesTable } from "@features/Category/infrastructure/persistence/category.schema";
import { mediaTable } from "@features/Media/infrastructure/persistence/media.schema";
import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    numeric,
    boolean,
    timestamp,
    primaryKey,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    sku: varchar("sku", { length: 100 }).unique(), // Nullable for variable products, required for simple
    type: productTypeEnum("type").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    price: numeric("price", { precision: 10, scale: 2 }), // Required for simple, null for variable
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
    stockQuantity: integer("stock_quantity").default(0), // Applicable for simple products
    brandId: uuid("brand_id").references(() => brandsTable.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productCategoriesTable = pgTable(
    "product_categories",
    {
        productId: uuid("product_id")
            .notNull()
            .references(() => productsTable.id, { onDelete: "cascade" }),
        categoryId: uuid("category_id")
            .notNull()
            .references(() => categoriesTable.id, { onDelete: "restrict" }),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.productId, table.categoryId] }),
    })
);

export const productMediaTable = pgTable(
    "product_media",
    {
        productId: uuid("product_id")
            .notNull()
            .references(() => productsTable.id, { onDelete: "cascade" }),
        mediaId: uuid("media_id")
            .notNull()
            .references(() => mediaTable.id, { onDelete: "restrict" }),
        isThumbnail: boolean("is_thumbnail").default(false).notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.productId, table.mediaId] }),
    })
);

export const productVariantsTable = pgTable("product_variants", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
        .notNull()
        .references(() => productsTable.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const variantAttributeValuesTable = pgTable(
    "variant_attribute_values",
    {
        variantId: uuid("variant_id")
            .notNull()
            .references(() => productVariantsTable.id, { onDelete: "cascade" }),
        attributeValueId: uuid("attribute_value_id")
            .notNull()
            .references(() => attributeValuesTable.id, { onDelete: "restrict" }),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.variantId, table.attributeValueId] }),
    })
);

export const variantMediaTable = pgTable(
    "variant_media",
    {
        variantId: uuid("variant_id")
            .notNull()
            .references(() => productVariantsTable.id, { onDelete: "cascade" }),
        mediaId: uuid("media_id")
            .notNull()
            .references(() => mediaTable.id, { onDelete: "restrict" }),
        isThumbnail: boolean("is_thumbnail").default(false).notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.variantId, table.mediaId] }),
    })
);
