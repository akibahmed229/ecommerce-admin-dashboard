import { Media } from "@features/Media/domain/media.entity";

export type AttributeType =
    | "dropdown"
    | "radio"
    | "checkbox"
    | "colour_swatch"
    | "image_swatch";

export interface AttributeValue {
    id: string;
    attributeId: string;
    value: string;
    slug: string;
    hexCode: string | null;
    mediaId: string | null;
    media?: Media | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Attribute {
    id: string;
    name: string;
    slug: string;
    type: AttributeType;
    createdAt: Date;
    updatedAt: Date;
}

export interface AttributeWithValues extends Attribute {
    values: AttributeValue[];
}

export interface CreateAttributeInput {
    name: string;
    slug: string;
    type: AttributeType;
}

export interface UpdateAttributeInput {
    name?: string;
    slug?: string;
    type?: AttributeType;
}

export interface CreateAttributeValueInput {
    value: string;
    slug: string;
    hexCode?: string;
    mediaId?: string;
}

export interface UpdateAttributeValueInput {
    value?: string;
    slug?: string;
    hexCode?: string;
    mediaId?: string;
}
