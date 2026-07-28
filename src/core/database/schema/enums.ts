import { pgEnum } from "drizzle-orm/pg-core";

export const roleStatusEnum = pgEnum("role_status", ["active", "inactive"]);
export const userGenderEnum = pgEnum("user_gender", ["male", "female", "other"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video", "document", "other"]);
export const brandStatusEnum = pgEnum("brand_status", ["active", "inactive"]);
export const attributeTypeEnum = pgEnum("attribute_type", [
    "dropdown",
    "radio",
    "checkbox",
    "colour_swatch",
    "image_swatch",
]);
export const productTypeEnum = pgEnum("product_type", ["simple", "variable"]);
