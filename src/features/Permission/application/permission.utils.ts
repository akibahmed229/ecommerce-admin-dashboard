import { ValidationError } from "@core/errors/AppError";

export function normalizeAction(raw: string): string {
    const trimmed = raw.trim();
    if (/\s/.test(trimmed)) throw new ValidationError(`Action "${raw}" cannot contain spaces`);
    return trimmed.toLowerCase();
}

export function slugifyGroupName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, "-");
}
