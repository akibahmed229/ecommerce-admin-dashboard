export type MediaType = "image" | "video" | "document" | "other";

export interface Media {
    id: string;
    fileName: string;
    storedPath: string;
    publicUrl: string;
    mimeType: string;
    type: MediaType;
    size: number;
    width: number | null;
    height: number | null;
    thumbnailUrl: string | null;
    altText: string | null;
    title: string | null;
    uploadedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateMediaInput {
    fileName: string;
    storedPath: string;
    publicUrl: string;
    mimeType: string;
    type: MediaType;
    size: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    altText?: string;
    title?: string;
    uploadedBy?: string;
}

export interface UpdateMediaMetadataInput {
    altText?: string;
    title?: string;
}

export interface MediaFilterOptions {
    type?: MediaType;
}
