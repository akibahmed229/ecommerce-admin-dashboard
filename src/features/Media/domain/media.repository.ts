import {
    Media,
    CreateMediaInput,
    UpdateMediaMetadataInput,
    MediaFilterOptions,
} from "./media.entity";
import { PaginationOptions, PaginatedResult } from "@core/types/pagination";

export interface IMediaRepository {
    findById(id: string): Promise<Media | null>;

    findByIds(ids: string[]): Promise<Media[]>;

    findAll(
        options: PaginationOptions,
        filters?: MediaFilterOptions
    ): Promise<PaginatedResult<Media>>;

    create(input: CreateMediaInput): Promise<Media>;

    createBatch(inputs: CreateMediaInput[]): Promise<Media[]>;

    updateMetadata(
        id: string,
        input: UpdateMediaMetadataInput
    ): Promise<Media>;

    delete(id: string): Promise<boolean>;

    // Verifies if file is referenced anywhere in DB prior to physical deletion
    checkUsage(
        id: string
    ): Promise<{ isAttached: boolean; attachedToModule?: string }>;
}
