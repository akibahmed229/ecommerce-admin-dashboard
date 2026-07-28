import { permissionsTable } from "@core/database/schema";
import { roleStatusEnum } from "@core/database/schema/enums";
import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    primaryKey,
} from "drizzle-orm/pg-core";


export const rolesTable = pgTable("roles", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    status: roleStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rolePermissionsTable = pgTable(
    "role_permissions",
    {
        roleId: uuid("role_id")
            .notNull()
            .references(() => rolesTable.id, { onDelete: "cascade" }),
        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissionsTable.id, { onDelete: "cascade" }),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
    })
);
