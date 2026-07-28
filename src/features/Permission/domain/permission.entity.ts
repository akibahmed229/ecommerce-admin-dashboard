export interface PermissionGroup {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Permission {
    id: string;
    groupId: string;
    name: string; // Module:action e.g. "product:create"
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PermissionGroupWithActions extends PermissionGroup {
    actions: Permission[];
}

export interface CreatePermissionGroupInput {
    name: string;
    description?: string;
    actions: {
        name: string; // Action suffix or full name
        description?: string;
    }[];
}

export interface UpdatePermissionGroupInput {
    name?: string;
    description?: string;
}
