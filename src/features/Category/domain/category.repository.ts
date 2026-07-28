import {
    Category,
    CategoryWithDetails,
    CategoryTreeNode,
    CreateCategoryInput,
    UpdateCategoryInput,
} from "./category.entity";

export interface ICategoryRepository {
    findById(id: string): Promise<CategoryWithDetails | null>;

    findBySlug(slug: string): Promise<Category | null>;

    findAllFlat(): Promise<CategoryWithDetails[]>;

    findTree(): Promise<CategoryTreeNode[]>;

    create(input: CreateCategoryInput): Promise<Category>;

    update(id: string, input: UpdateCategoryInput): Promise<Category>;

    delete(id: string): Promise<boolean>;

    // Walks up parent chains for cycle validation
    getAncestorIds(categoryId: string): Promise<string[]>;

    countChildren(categoryId: string): Promise<number>;

    countAttachedProducts(categoryId: string): Promise<number>;
}
