import { mediaTable } from "@core/database/schema";
import { brandStatusEnum } from "@core/database/schema/enums";
import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const brandsTable = pgTable("brands", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    logoId: uuid("logo_id").references(() => mediaTable.id, { onDelete: "restrict" }),
    status: brandStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
