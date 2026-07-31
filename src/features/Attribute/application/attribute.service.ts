import { AttributeRepository } from "../infrastructure/persistence/attribute.repository.impl";
import { CreateAttributeInput, UpdateAttributeInput, CreateAttributeValueInput, UpdateAttributeValueInput } from "../domain/attribute.entity";
import { ConflictError, NotFoundError } from "@core/errors/AppError";

const repo = new AttributeRepository();

export const attributeService = {
    list: () => repo.findAll(),

    async get(id: string) {
        const attribute = await repo.findById(id);
        if (!attribute) throw new NotFoundError("Attribute not found");
        return attribute;
    },

    async create(input: CreateAttributeInput) {
        if (await repo.findBySlug(input.slug)) throw new ConflictError("An attribute with this slug already exists");
        return repo.create(input);
    },

    async update(id: string, input: UpdateAttributeInput) {
        if (!(await repo.findById(id))) throw new NotFoundError("Attribute not found");
        return repo.update(id, input);
    },

    async remove(id: string) {
        const attribute = await repo.findById(id);
        if (!attribute) throw new NotFoundError("Attribute not found");
        // Same "refuse if referenced" policy as Category/Brand — delete the values first, deliberately,
        // rather than letting a cascade quietly wipe values that might already be on a variant.
        if (attribute.values.length > 0) {
            throw new ConflictError(`Cannot delete — ${attribute.values.length} value(s) still exist under this attribute`);
        }
        return repo.delete(id);
    },

    async addValue(attributeId: string, input: CreateAttributeValueInput) {
        const attribute = await repo.findById(attributeId);
        if (!attribute) throw new NotFoundError("Attribute not found");
        const duplicate = attribute.values.some((v) => v.slug === input.slug || v.value.toLowerCase() === input.value.toLowerCase());
        if (duplicate) throw new ConflictError("A value with this name already exists under this attribute");
        return repo.addValue(attributeId, input);
    },

    async updateValue(attributeId: string, valueId: string, input: UpdateAttributeValueInput) {
        const value = await repo.findValueById(valueId);
        if (!value || value.attributeId !== attributeId) throw new NotFoundError("Attribute value not found");
        return repo.updateValue(valueId, input);
    },

    async removeValue(attributeId: string, valueId: string) {
        const value = await repo.findValueById(valueId);
        if (!value || value.attributeId !== attributeId) throw new NotFoundError("Attribute value not found");
        const usage = await repo.countVariantsUsingValue(valueId);
        if (usage > 0) throw new ConflictError(`Cannot delete — used by ${usage} product variant(s)`);
        return repo.deleteValue(valueId);
    },
};
