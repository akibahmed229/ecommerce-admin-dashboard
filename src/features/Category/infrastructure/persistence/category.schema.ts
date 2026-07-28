import { mediaTable } from "@features/Media/infrastructure/persistence/media.schema";
import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageId: uuid("image_id").references(() => mediaTable.id, { onDelete: "restrict" }),
    parentId: uuid("parent_id").references((): any => categoriesTable.id, { onDelete: "restrict" }), // Refuse orphan cascading
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
