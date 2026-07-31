import { CategoryRepository } from "../infrastructure/persistence/category.repository.impl";
import { CreateCategoryInput, UpdateCategoryInput } from "../domain/category.entity";
import { ConflictError, NotFoundError, ValidationError } from "@core/errors/AppError";

const repo = new CategoryRepository();

export const categoryService = {
    list: () => repo.findAllFlat(),
    tree: () => repo.findTree(),

    async get(id: string) {
        const category = await repo.findById(id);
        if (!category) throw new NotFoundError("Category not found");
        return category;
    },

    async create(input: CreateCategoryInput) {
        if (await repo.findBySlug(input.slug)) throw new ConflictError("A category with this slug already exists");
        if (input.parentId && !(await repo.findById(input.parentId))) throw new ValidationError("parentId does not reference an existing category");
        return repo.create(input);
    },

    async update(id: string, input: UpdateCategoryInput) {
        const existing = await repo.findById(id);
        if (!existing) throw new NotFoundError("Category not found");

        if (input.slug && input.slug !== existing.slug) {
            if (await repo.findBySlug(input.slug)) throw new ConflictError("A category with this slug already exists");
        }

        if (input.parentId !== undefined && input.parentId !== existing.parentId) {
            if (input.parentId === id) throw new ValidationError("A category cannot be its own parent");
            if (input.parentId) {
                if (!(await repo.findById(input.parentId))) throw new ValidationError("parentId does not reference an existing category");
                // Cycle check: is `id` sitting somewhere in the ancestor chain of the proposed new parent?
                const ancestorsOfNewParent = await repo.getAncestorIds(input.parentId);
                if (ancestorsOfNewParent.includes(id)) {
                    throw new ValidationError("This change would make the category its own ancestor");
                }
            }
        }

        return repo.update(id, input);
    },

    async remove(id: string) {
        if (!(await repo.findById(id))) throw new NotFoundError("Category not found");
        const childCount = await repo.countChildren(id);
        if (childCount > 0) throw new ConflictError(`Cannot delete — ${childCount} subcategory(ies) still reference this as parent`);
        const productCount = await repo.countAttachedProducts(id);
        if (productCount > 0) throw new ConflictError(`Cannot delete — ${productCount} product(s) still attached`);
        return repo.delete(id);
    },
};
