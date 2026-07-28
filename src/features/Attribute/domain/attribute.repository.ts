import {
    Attribute,
    AttributeValue,
    AttributeWithValues,
    CreateAttributeInput,
    UpdateAttributeInput,
    CreateAttributeValueInput,
    UpdateAttributeValueInput,
} from "./attribute.entity";

export interface IAttributeRepository {
    findById(id: string): Promise<AttributeWithValues | null>;

    findBySlug(slug: string): Promise<Attribute | null>;

    findAll(): Promise<AttributeWithValues[]>;

    create(input: CreateAttributeInput): Promise<Attribute>;

    update(id: string, input: UpdateAttributeInput): Promise<Attribute>;

    delete(id: string): Promise<boolean>;

    // Value Operations
    findValueById(valueId: string): Promise<AttributeValue | null>;

    addValue(
        attributeId: string,
        input: CreateAttributeValueInput
    ): Promise<AttributeValue>;

    updateValue(
        valueId: string,
        input: UpdateAttributeValueInput
    ): Promise<AttributeValue>;

    deleteValue(valueId: string): Promise<boolean>;

    countVariantsUsingValue(valueId: string): Promise<number>;
}
