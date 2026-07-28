import { mediaTypeEnum } from "@core/database/schema/enums";
import { usersTable } from "@features/User/infrastructure/persistence/user.schema";
import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    bigint,
    timestamp,
} from "drizzle-orm/pg-core";

export const mediaTable = pgTable("media", {
    id: uuid("id").defaultRandom().primaryKey(),
    fileName: text("file_name").notNull(),
    storedPath: text("stored_path").notNull(),
    publicUrl: text("public_url").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    type: mediaTypeEnum("type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(), // Size in bytes
    width: integer("width"),
    height: integer("height"),
    thumbnailUrl: text("thumbnail_url"),
    altText: text("alt_text"),
    title: text("title"),
    uploadedBy: uuid("uploaded_by").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
