import { userGenderEnum } from "@core/database/schema/enums";
import { rolesTable } from "@features/Role/infrastructure/persistence/role.schema";
import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(), // Hashed
    phone: varchar("phone", { length: 50 }),
    gender: userGenderEnum("gender"),
    avatar: text("avatar"), // Direct URL or string path
    roleId: uuid("role_id")
        .notNull()
        .references(() => rolesTable.id, { onDelete: "restrict" }), // Refuse role delete if user exists
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
