import { BrandRepository } from "../infrastructure/persistence/brand.repository.impl";
import { CreateBrandInput, UpdateBrandInput, BrandFilterOptions } from "../domain/brand.entity";
import { PaginationOptions } from "@core/types/pagination";
import { ConflictError, NotFoundError } from "@core/errors/AppError";

const repo = new BrandRepository();

export const brandService = {
    list: (options: PaginationOptions, filters: BrandFilterOptions) => repo.findAll(options, filters),

    async get(id: string) {
        const brand = await repo.findById(id);
        if (!brand) throw new NotFoundError("Brand not found");
        return brand;
    },

    async create(input: CreateBrandInput) {
        if (await repo.findBySlug(input.slug)) throw new ConflictError("A brand with this slug already exists");
        return repo.create(input); // name collision falls through to the DB unique constraint → 409 via errorHandler
    },

    async update(id: string, input: UpdateBrandInput) {
        if (!(await repo.findById(id))) throw new NotFoundError("Brand not found");
        return repo.update(id, input);
    },

    async remove(id: string) {
        if (!(await repo.findById(id))) throw new NotFoundError("Brand not found");
        const productCount = await repo.countAttachedProducts(id);
        if (productCount > 0) throw new ConflictError(`Cannot delete — ${productCount} product(s) still reference this brand`);
        return repo.delete(id);
    },
};
