import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const permissionGroupsTable = pgTable("permission_groups", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "Product"
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissionsTable = pgTable("permissions", {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
        .notNull()
        .references(() => permissionGroupsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "product:create"
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
