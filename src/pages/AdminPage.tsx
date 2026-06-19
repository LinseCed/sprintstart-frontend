// ============================================================
// AdminPage.tsx
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Folder,
    Loader2,
    Mail,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Terminal,
    Trash2,
    X,
} from "lucide-react";
import {
    adminUserService,
    type AdminUser,
    type AvailableRole,
    type ProjectSummary,
    type RoleAssignment,
    type RoleType,
    type UserRole,
} from "../services/adminUserService";

type LoadingState = "idle" | "loading" | "success" | "error";
type UserFilter = "all" | "enabled" | "disabled" | "onboarded" | "not-onboarded";

const PAGE_SIZE = 8;
const DRAWER_CLOSE_DELAY_MS = 260;

function getDisplayName(user: AdminUser) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.username || user.email;
}

function getInitials(user: AdminUser) {
    return getDisplayName(user)
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getRoleBadgeVariant(index: number, roleType?: RoleType) {
    if (roleType === "primary") return "brand";
    if (roleType === "secondary") return index % 2 === 0 ? "warning" : "neutral";
    return "neutral";
}

function getPermissionGroupVariant(permissionGroup: string) {
    const normalized = permissionGroup.toUpperCase();

    if (normalized.includes("ADMIN")) return "warning";
    if (normalized.includes("PROJECT")) return "success";
    return "neutral";
}

function AccessBadge({
                         children,
                         variant = "brand",
                     }: {
    children: string;
    variant?: "success" | "brand" | "warning" | "neutral" | "danger";
}) {
    const classes = {
        success:
            "border-app-success-border bg-app-success-bg text-app-success-text",
        brand: "border-app-brand-border bg-app-brand-soft text-app-brand-text",
        warning:
            "border-app-warning-border bg-app-warning-bg text-app-warning-text",
        neutral:
            "border-app-neutral-border bg-app-neutral-bg text-app-neutral-text",
        danger: "border-app-danger-border bg-app-danger-bg text-app-danger-text",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold leading-none ${classes[variant]}`}
        >
      {children}
    </span>
    );
}

function RemovableLabel({
                            children,
                            variant = "brand",
                            onRemove,
                        }: {
    children: string;
    variant?: "success" | "brand" | "warning" | "neutral" | "danger";
    onRemove: () => void;
}) {
    const classes = {
        success:
            "border-app-success-border bg-app-success-bg text-app-success-text",
        brand: "border-app-brand-border bg-app-brand-soft text-app-brand-text",
        warning:
            "border-app-warning-border bg-app-warning-bg text-app-warning-text",
        neutral:
            "border-app-neutral-border bg-app-neutral-bg text-app-neutral-text",
        danger: "border-app-danger-border bg-app-danger-bg text-app-danger-text",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold leading-none ${classes[variant]}`}
        >
      {children}
            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remove ${children}`}
            >
        <X className="h-3 w-3" />
      </button>
    </span>
    );
}

function SelectionCheckbox({
                               checked,
                               onChange,
                               ariaLabel,
                           }: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
}) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={onChange}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                checked
                    ? "border-app-brand bg-app-brand text-white shadow-sm shadow-app-brand-glow"
                    : "border-app-border bg-app-surface hover:border-app-brand-border-strong hover:bg-app-brand-soft"
            }`}
        >
            {checked && <Check className="h-4 w-4 stroke-[3]" />}
        </button>
    );
}

function TableHeader({ children }: { children: string }) {
    return (
        <div className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
            {children}
        </div>
    );
}

function RoleList({ roles, max = 2 }: { roles: UserRole[]; max?: number }) {
    if (roles.length === 0) {
        return <span className="text-sm text-app-text-muted">No roles</span>;
    }

    return (
        <div className="flex min-w-0 flex-wrap gap-2">
            {roles.slice(0, max).map((role, index) => (
                <AccessBadge
                    key={`${role.id}-${role.type}`}
                    variant={getRoleBadgeVariant(index, role.type)}
                >
                    {role.name}
                </AccessBadge>
            ))}

            {roles.length > max && (
                <AccessBadge variant="neutral">+{roles.length - max}</AccessBadge>
            )}
        </div>
    );
}

function ProjectList({
                         projects,
                         max = 2,
                     }: {
    projects: AdminUser["projects"];
    max?: number;
}) {
    if (projects.length === 0) {
        return <span className="text-sm text-app-text-muted">No projects</span>;
    }

    return (
        <div className="flex min-w-0 flex-wrap gap-2">
            {projects.slice(0, max).map((project) => (
                <AccessBadge key={project.id} variant="neutral">
                    {project.name}
                </AccessBadge>
            ))}

            {projects.length > max && (
                <AccessBadge variant="neutral">+{projects.length - max}</AccessBadge>
            )}
        </div>
    );
}

function DetailRow({
                       label,
                       value,
                       mono = false,
                   }: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="grid grid-cols-[7.5rem_1fr] items-start gap-4 py-2.5">
            <dt className="text-sm text-app-text-muted">{label}</dt>
            <dd
                className={`break-words text-sm font-medium text-app-text ${
                    mono ? "font-mono text-xs" : ""
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="mt-10 border-t border-app-border pt-8 first:mt-0 first:border-t-0 first:pt-0">
            <h3 className="mb-5 text-base font-semibold text-app-text">{title}</h3>
            {children}
        </section>
    );
}

function RolePicker({
                        roles,
                        onSelect,
                        emptyLabel,
                    }: {
    roles: AvailableRole[];
    onSelect: (roleId: string) => void;
    emptyLabel: string;
}) {
    const [search, setSearch] = useState("");

    const filteredRoles = roles.filter((role) => {
        const normalizedSearch = search.trim().toLowerCase();

        return (
            normalizedSearch.length === 0 ||
            role.name.toLowerCase().includes(normalizedSearch) ||
            role.description.toLowerCase().includes(normalizedSearch) ||
            role.id.toLowerCase().includes(normalizedSearch)
        );
    });

    return (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-app-border bg-app-surface p-2 shadow-xl">
            <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-text-disabled" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search roles..."
                    className="h-9 w-full rounded-xl border border-app-border bg-app-surface-muted pl-9 pr-3 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                />
            </div>

            <div className="max-h-56 space-y-1 overflow-auto">
                {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => onSelect(role.id)}
                            className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-app-surface-hover"
                        >
                            <div className="text-sm font-medium text-app-text">
                                {role.name}
                            </div>
                            <div className="mt-0.5 line-clamp-2 text-xs text-app-text-muted">
                                {role.description}
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="px-3 py-3 text-sm text-app-text-muted">{emptyLabel}</p>
                )}
            </div>
        </div>
    );
}

type ProjectRoleDraft = {
    primaryRoleId: string;
    secondaryRoleIds: Set<string>;
};

function ProjectAccessPanel({
                                assignedProjects,
                                availableProjects,
                                availableRoles,
                                primaryRoleId,
                                secondaryRoleIds,
                                onPrimaryRoleChange,
                                onSecondaryRoleToggle,
                            }: {
    assignedProjects: ProjectSummary[];
    availableProjects: ProjectSummary[];
    availableRoles: AvailableRole[];
    primaryRoleId: string;
    secondaryRoleIds: Set<string>;
    onPrimaryRoleChange: (roleId: string) => void;
    onSecondaryRoleToggle: (roleId: string) => void;
}) {
    const [draftProjectIds, setDraftProjectIds] = useState<Set<string>>(
        new Set(assignedProjects.map((project) => project.id)),
    );
    const [projectSearch, setProjectSearch] = useState("");
    const [openProjectPicker, setOpenProjectPicker] = useState(false);
    const [openRolePicker, setOpenRolePicker] = useState<{
        projectId: string;
        type: "primary" | "secondary";
    } | null>(null);
    const [projectRoleDrafts, setProjectRoleDrafts] = useState<
        Record<string, ProjectRoleDraft>
    >({});

    useEffect(() => {
        const nextProjectIds = new Set(assignedProjects.map((project) => project.id));
        const nextProjectRoleDrafts: Record<string, ProjectRoleDraft> = {};

        assignedProjects.forEach((project) => {
            nextProjectRoleDrafts[project.id] = {
                primaryRoleId,
                secondaryRoleIds: new Set(secondaryRoleIds),
            };
        });

        setDraftProjectIds(nextProjectIds);
        setProjectRoleDrafts(nextProjectRoleDrafts);
        setProjectSearch("");
        setOpenProjectPicker(false);
        setOpenRolePicker(null);
    }, [assignedProjects, primaryRoleId, secondaryRoleIds]);

    const assignedDraftProjects = availableProjects.filter((project) =>
        draftProjectIds.has(project.id),
    );

    const projectOptions = availableProjects.filter((project) => {
        const isAlreadyAssigned = draftProjectIds.has(project.id);
        const matchesSearch =
            projectSearch.trim().length === 0 ||
            project.name.toLowerCase().includes(projectSearch.trim().toLowerCase()) ||
            project.id.toLowerCase().includes(projectSearch.trim().toLowerCase());

        return !isAlreadyAssigned && matchesSearch;
    });

    const addProject = (projectId: string) => {
        setDraftProjectIds((current) => {
            const next = new Set(current);
            next.add(projectId);
            return next;
        });

        setProjectRoleDrafts((current) => ({
            ...current,
            [projectId]: {
                primaryRoleId: "",
                secondaryRoleIds: new Set(),
            },
        }));

        setProjectSearch("");
        setOpenProjectPicker(false);
    };

    const removeProject = (projectId: string) => {
        setDraftProjectIds((current) => {
            const next = new Set(current);
            next.delete(projectId);
            return next;
        });

        setProjectRoleDrafts((current) => {
            const next = { ...current };
            delete next[projectId];
            return next;
        });
    };

    const setProjectPrimaryRole = (projectId: string, roleId: string) => {
        setProjectRoleDrafts((current) => ({
            ...current,
            [projectId]: {
                primaryRoleId: roleId,
                secondaryRoleIds:
                    current[projectId]?.secondaryRoleIds ?? new Set<string>(),
            },
        }));

        onPrimaryRoleChange(roleId);
        setOpenRolePicker(null);
    };

    const removeProjectPrimaryRole = (projectId: string) => {
        setProjectRoleDrafts((current) => ({
            ...current,
            [projectId]: {
                primaryRoleId: "",
                secondaryRoleIds:
                    current[projectId]?.secondaryRoleIds ?? new Set<string>(),
            },
        }));

        onPrimaryRoleChange("");
    };

    const toggleProjectSecondaryRole = (projectId: string, roleId: string) => {
        setProjectRoleDrafts((current) => {
            const currentDraft = current[projectId] ?? {
                primaryRoleId: "",
                secondaryRoleIds: new Set<string>(),
            };
            const nextSecondaryRoleIds = new Set(currentDraft.secondaryRoleIds);

            if (nextSecondaryRoleIds.has(roleId)) {
                nextSecondaryRoleIds.delete(roleId);
            } else {
                nextSecondaryRoleIds.add(roleId);
            }

            return {
                ...current,
                [projectId]: {
                    ...currentDraft,
                    secondaryRoleIds: nextSecondaryRoleIds,
                },
            };
        });

        onSecondaryRoleToggle(roleId);
        setOpenRolePicker(null);
    };

    return (
        <div className="rounded-3xl border border-app-border bg-app-surface-muted p-4">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="items-center align-middle">
                    <p className="text-2xl font-semibold text-app-text">
                        Projects
                    </p>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenProjectPicker((current) => !current)}
                        className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add project
                    </button>

                    {openProjectPicker && (
                        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-app-border bg-app-surface p-2 shadow-xl">
                            <div className="relative mb-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-text-disabled" />
                                <input
                                    value={projectSearch}
                                    onChange={(event) => setProjectSearch(event.target.value)}
                                    placeholder="Search projects..."
                                    className="h-9 w-full rounded-xl border border-app-border bg-app-surface-muted pl-9 pr-3 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                                />
                            </div>

                            <div className="max-h-64 space-y-1 overflow-auto">
                                {projectOptions.length > 0 ? (
                                    projectOptions.map((project) => (
                                        <button
                                            key={project.id}
                                            type="button"
                                            onClick={() => addProject(project.id)}
                                            className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-app-surface-hover"
                                        >
                                            <p className="text-sm font-medium text-app-text">
                                                {project.name}
                                            </p>
                                            <p className="mt-0.5 truncate font-mono text-xs text-app-text-muted">
                                                {project.id}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-3 py-3 text-sm text-app-text-muted">
                                        No unassigned projects available.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {assignedDraftProjects.length > 0 ? (
                    assignedDraftProjects.map((project) => {
                        const draft = projectRoleDrafts[project.id] ?? {
                            primaryRoleId: "",
                            secondaryRoleIds: new Set<string>(),
                        };
                        const primaryRole = availableRoles.find(
                            (role) => role.id === draft.primaryRoleId,
                        );
                        const secondaryRoles = availableRoles.filter((role) =>
                            draft.secondaryRoleIds.has(role.id),
                        );

                        const primaryRoleOptions = availableRoles.filter(
                            (role) => !draft.secondaryRoleIds.has(role.id),
                        );
                        const secondaryRoleOptions = availableRoles.filter(
                            (role) =>
                                role.id !== draft.primaryRoleId &&
                                !draft.secondaryRoleIds.has(role.id),
                        );

                        return (
                            <div
                                key={project.id}
                                className="rounded-2xl border border-app-border bg-app-surface px-4 py-4"
                            >
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-surface-muted text-app-text-muted">
                                            <Folder className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-semibold text-app-text">
                                                {project.name}
                                            </p>
                                            <p className="mt-1 break-all font-mono text-xs text-app-text-muted">
                                                {project.id}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeProject(project.id)}
                                        className="rounded-lg p-1.5 text-app-text-disabled transition-colors hover:bg-app-danger-bg hover:text-app-danger-text"
                                        aria-label={`Remove ${project.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-2">
                                    <div className="relative rounded-2xl border border-app-border bg-app-surface-muted p-3">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                                    Primary role
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenRolePicker((current) =>
                                                        current?.projectId === project.id &&
                                                        current.type === "primary"
                                                            ? null
                                                            : { projectId: project.id, type: "primary" },
                                                    )
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                                aria-label={`Add primary role for ${project.name}`}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex min-h-9 flex-wrap gap-2">
                                            {primaryRole ? (
                                                <RemovableLabel
                                                    variant="brand"
                                                    onRemove={() => removeProjectPrimaryRole(project.id)}
                                                >
                                                    {primaryRole.name}
                                                </RemovableLabel>
                                            ) : (
                                                <span className="text-sm text-app-text-muted">
                          No primary role.
                        </span>
                                            )}
                                        </div>

                                        {openRolePicker?.projectId === project.id &&
                                            openRolePicker.type === "primary" && (
                                                <RolePicker
                                                    roles={primaryRoleOptions}
                                                    onSelect={(roleId) =>
                                                        setProjectPrimaryRole(project.id, roleId)
                                                    }
                                                    emptyLabel="No roles available."
                                                />
                                            )}
                                    </div>

                                    <div className="relative rounded-2xl border border-app-border bg-app-surface-muted p-3">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                                    Secondary roles
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenRolePicker((current) =>
                                                        current?.projectId === project.id &&
                                                        current.type === "secondary"
                                                            ? null
                                                            : { projectId: project.id, type: "secondary" },
                                                    )
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                                aria-label={`Add secondary role for ${project.name}`}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex min-h-9 flex-wrap gap-2">
                                            {secondaryRoles.length > 0 ? (
                                                secondaryRoles.map((role) => (
                                                    <RemovableLabel
                                                        key={role.id}
                                                        variant="neutral"
                                                        onRemove={() =>
                                                            toggleProjectSecondaryRole(project.id, role.id)
                                                        }
                                                    >
                                                        {role.name}
                                                    </RemovableLabel>
                                                ))
                                            ) : (
                                                <span className="text-sm text-app-text-muted">
                          No secondary roles.
                        </span>
                                            )}
                                        </div>

                                        {openRolePicker?.projectId === project.id &&
                                            openRolePicker.type === "secondary" && (
                                                <RolePicker
                                                    roles={secondaryRoleOptions}
                                                    onSelect={(roleId) =>
                                                        toggleProjectSecondaryRole(project.id, roleId)
                                                    }
                                                    emptyLabel="No more roles available."
                                                />
                                            )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface px-4 py-8 text-center">
                        <p className="text-sm font-medium text-app-text">
                            No projects assigned
                        </p>
                        <p className="mt-1 text-sm text-app-text-muted">
                            Add a project to prepare project-specific role assignments.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

type UserDetailsDrawerProps = {
    user: AdminUser;
    availableRoles: AvailableRole[];
    availableProjects: ProjectSummary[];
    isOpen: boolean;
    isSaving: boolean;
    onClose: () => void;
    onSaveRoles: (userId: string, roles: RoleAssignment[]) => Promise<void>;
};

function UserDetailsDrawer({
                               user,
                               availableRoles,
                               availableProjects,
                               isOpen,
                               isSaving,
                               onClose,
                               onSaveRoles,
                           }: UserDetailsDrawerProps) {
    const [primaryRoleId, setPrimaryRoleId] = useState<string>("");
    const [secondaryRoleIds, setSecondaryRoleIds] = useState<Set<string>>(
        new Set(),
    );

    useEffect(() => {
        const primaryRole = user.roles.find((role) => role.type === "primary");
        const secondaryRoles = user.roles.filter(
            (role) => role.type === "secondary",
        );

        setPrimaryRoleId(primaryRole?.id ?? "");
        setSecondaryRoleIds(new Set(secondaryRoles.map((role) => role.id)));
    }, [user]);

    const toggleSecondaryRole = (roleId: string) => {
        setSecondaryRoleIds((current) => {
            const next = new Set(current);

            if (next.has(roleId)) {
                next.delete(roleId);
            } else {
                next.add(roleId);
            }

            return next;
        });
    };

    const handleSave = async () => {
        const nextRoles: RoleAssignment[] = [];

        if (primaryRoleId) {
            nextRoles.push({
                id: primaryRoleId,
                type: "primary",
            });
        }

        secondaryRoleIds.forEach((roleId) => {
            if (roleId !== primaryRoleId) {
                nextRoles.push({
                    id: roleId,
                    type: "secondary",
                });
            }
        });

        await onSaveRoles(user.id, nextRoles);
    };

    return (
        <aside
            className={`fixed inset-y-0 right-0 z-40 flex h-screen w-[min(94vw,34rem)] flex-col rounded-l-3xl border-l border-app-border bg-app-surface shadow-2xl transition-[transform,opacity] duration-300 ease-out lg:w-[min(72vw,58rem)] ${
                isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
        >
            <div className="flex-1 overflow-auto">
                <div className="mx-5 px-4 pb-10 pt-5 lg:px-5 lg:pt-6">
                    <div className="mb-9 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface text-lg font-semibold text-app-brand-text shadow-sm">
                                {getInitials(user)}
                            </div>

                            <div className="min-w-0 pt-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <h2 className="truncate text-2xl font-semibold text-app-text">
                                        {getDisplayName(user)}
                                    </h2>
                                    <AccessBadge
                                        variant={getPermissionGroupVariant(user.permissionGroup)}
                                    >
                                        {user.permissionGroup}
                                    </AccessBadge>
                                </div>

                                <div className="mt-2 flex items-center gap-1.5 text-sm text-app-text-muted">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-xl p-2 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                            aria-label="Close details"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mb-10 grid grid-cols-2 gap-8">
                        <div>
                            <p className="mb-2 text-sm text-app-text-muted">Account state</p>
                            <div className="flex items-center gap-2 text-sm font-medium text-app-text">
                                <CheckCircle2
                                    className={`h-4 w-4 ${
                                        user.enabled
                                            ? "text-app-success-solid"
                                            : "text-app-danger-solid"
                                    }`}
                                />
                                {user.enabled ? "Enabled" : "Disabled"}
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm text-app-text-muted">Onboarding</p>
                            <div className="flex items-center gap-2 text-sm font-medium text-app-text">
                                <CheckCircle2
                                    className={`h-4 w-4 ${
                                        user.hasCompletedOnboarding
                                            ? "text-app-success-solid"
                                            : "text-app-warning-solid"
                                    }`}
                                />
                                {user.hasCompletedOnboarding ? "Completed" : "Open"}
                            </div>
                        </div>
                    </div>

                    <Section title="Personal details">
                        <dl>
                            <DetailRow label="Email" value={user.email} />
                            <DetailRow label="Username" value={user.username} />
                            <DetailRow label="First name" value={user.firstName} />
                            <DetailRow label="Last name" value={user.lastName} />
                            <DetailRow label="Profile icon" value={user.profileIcon} />
                            <DetailRow label="User ID" value={user.id} mono />
                        </dl>
                    </Section>

                    <Section title="Project access">
                        <ProjectAccessPanel
                            assignedProjects={user.projects}
                            availableProjects={availableProjects}
                            availableRoles={availableRoles}
                            primaryRoleId={primaryRoleId}
                            secondaryRoleIds={secondaryRoleIds}
                            onPrimaryRoleChange={setPrimaryRoleId}
                            onSecondaryRoleToggle={toggleSecondaryRole}
                        />
                    </Section>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-bl-3xl border-t border-app-border bg-app-surface px-4 py-4 lg:px-5">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-app-text px-5 py-2.5 text-sm font-medium text-app-text-inverse transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save
                </button>
            </div>
        </aside>
    );
}

export function AdminPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
        new Set(),
    );
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [loadingState, setLoadingState] = useState<LoadingState>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [searchValue, setSearchValue] = useState("");
    const [userFilter, setUserFilter] = useState<UserFilter>("all");
    const [showFilters, setShowFilters] = useState(false);

    const [page, setPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setLoadingState((current) => (current === "idle" ? "loading" : current));
        setErrorMessage("");

        try {
            const nextUsers = await adminUserService.getUsers();

            setUsers(nextUsers);
            setLoadingState("success");

            setSelectedUser((currentSelectedUser) => {
                if (!currentSelectedUser) return null;

                return (
                    nextUsers.find((user) => user.id === currentSelectedUser.id) ??
                    currentSelectedUser
                );
            });
        } catch (error) {
            setLoadingState("error");
            setErrorMessage(
                error instanceof Error ? error.message : "Users could not be loaded.",
            );
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (!selectedUser) {
            setIsDrawerOpen(false);
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            setIsDrawerOpen(true);
        });

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [selectedUser]);

    const availableRoles = useMemo(
        () => adminUserService.getAvailableRolesFromUsers(users),
        [users],
    );

    const availableProjects = useMemo(() => {
        const projectMap = new Map<string, ProjectSummary>();

        users.forEach((user) => {
            user.projects.forEach((project) => {
                if (!projectMap.has(project.id)) {
                    projectMap.set(project.id, project);
                }
            });
        });

        return Array.from(projectMap.values()).sort((left, right) =>
            left.name.localeCompare(right.name),
        );
    }, [users]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase();

        return users.filter((user) => {
            const searchableValues = [
                user.id,
                user.username,
                user.email,
                user.firstName,
                user.lastName,
                user.permissionGroup,
                user.profileIcon,
                String(user.enabled),
                String(user.hasCompletedOnboarding),
                ...user.roles.flatMap((role) => [
                    role.id,
                    role.name,
                    role.description,
                    role.type,
                ]),
                ...user.projects.flatMap((project) => [project.id, project.name]),
            ];

            const matchesSearch =
                normalizedSearch.length === 0 ||
                searchableValues.some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                );

            const matchesFilter =
                userFilter === "all" ||
                (userFilter === "enabled" && user.enabled) ||
                (userFilter === "disabled" && !user.enabled) ||
                (userFilter === "onboarded" && user.hasCompletedOnboarding) ||
                (userFilter === "not-onboarded" && !user.hasCompletedOnboarding);

            return matchesSearch && matchesFilter;
        });
    }, [users, searchValue, userFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

    const paginatedUsers = useMemo(() => {
        const safePage = Math.min(page, totalPages);
        const startIndex = (safePage - 1) * PAGE_SIZE;

        return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filteredUsers, page, totalPages]);

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages));
    }, [totalPages]);

    const allVisibleUsersSelected =
        paginatedUsers.length > 0 &&
        paginatedUsers.every((user) => selectedUserIds.has(user.id));

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((current) => {
            const next = new Set(current);

            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }

            return next;
        });
    };

    const toggleAllVisibleUsers = () => {
        setSelectedUserIds((current) => {
            const next = new Set(current);

            if (allVisibleUsersSelected) {
                paginatedUsers.forEach((user) => next.delete(user.id));
            } else {
                paginatedUsers.forEach((user) => next.add(user.id));
            }

            return next;
        });
    };

    const openUserDetails = (user: AdminUser) => {
        setSelectedUser(user);
    };

    const closeUserDetails = () => {
        setIsDrawerOpen(false);

        window.setTimeout(() => {
            setSelectedUser(null);
        }, DRAWER_CLOSE_DELAY_MS);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);

        try {
            await loadUsers();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSaveRoles = async (userId: string, roles: RoleAssignment[]) => {
        setSavingUserId(userId);

        try {
            const updatedUser = await adminUserService.updateUserRoles(userId, {
                roles,
            });

            setUsers((currentUsers) =>
                currentUsers.map((user) => (user.id === userId ? updatedUser : user)),
            );

            setSelectedUser(updatedUser);
        } finally {
            setSavingUserId(null);
        }
    };

    const showInitialLoading =
        loadingState === "idle" || loadingState === "loading";

    return (
        <div className="min-h-screen bg-app-bg px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-app-brand shadow-sm">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">
                            User management
                        </h1>
                    </div>
                </header>

                <section>
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-xl font-semibold text-app-text">All users</h2>
                            <span className="text-xl font-medium text-app-text-disabled">
                {filteredUsers.length}
              </span>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-72">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-disabled" />
                                <input
                                    value={searchValue}
                                    onChange={(event) => {
                                        setSearchValue(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Search"
                                    className="h-10 w-full rounded-xl border border-app-border bg-app-surface pl-10 pr-4 text-sm text-app-text outline-none transition-colors placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                                />
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowFilters((current) => !current)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                                >
                                    <SlidersHorizontal className="h-4 w-4 text-app-text-muted" />
                                    Filters
                                </button>

                                {showFilters && (
                                    <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-app-border bg-app-surface p-2 shadow-xl">
                                        {[
                                            ["all", "All users"],
                                            ["enabled", "Enabled"],
                                            ["disabled", "Disabled"],
                                            ["onboarded", "Onboarding completed"],
                                            ["not-onboarded", "Onboarding open"],
                                        ].map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => {
                                                    setUserFilter(value as UserFilter);
                                                    setShowFilters(false);
                                                    setPage(1);
                                                }}
                                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                    userFilter === value
                                                        ? "bg-app-brand-soft text-app-brand-text"
                                                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleRefresh()}
                                disabled={isRefreshing}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Refresh users"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
                        {showInitialLoading ? (
                            <div className="flex min-h-96 items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-app-text-muted">
                                    <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                                    <p className="text-sm">Loading users...</p>
                                </div>
                            </div>
                        ) : loadingState === "error" ? (
                            <div className="flex min-h-96 items-center justify-center px-6 text-center">
                                <div className="max-w-md">
                                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-app-danger-solid" />
                                    <h3 className="text-base font-semibold text-app-text">
                                        Users could not be loaded
                                    </h3>
                                    <p className="mt-2 text-sm text-app-text-muted">
                                        {errorMessage}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void handleRefresh()}
                                        className="mt-5 rounded-xl bg-app-text px-5 py-2.5 text-sm font-medium text-app-text-inverse transition-colors hover:opacity-90"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        ) : paginatedUsers.length === 0 ? (
                            <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
                                <p className="text-base font-medium text-app-text">
                                    No users found
                                </p>
                                <p className="mt-1 text-sm text-app-text-muted">
                                    Try another search term or change the filters.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden lg:block">
                                    <div className="grid grid-cols-[56px_2.2fr_2fr_2fr_44px] items-center border-b border-app-border bg-app-surface-muted px-5 py-4">
                                        <div className="flex items-center">
                                            <SelectionCheckbox
                                                checked={allVisibleUsersSelected}
                                                onChange={toggleAllVisibleUsers}
                                                ariaLabel="Select all users"
                                            />
                                        </div>

                                        <TableHeader>User name</TableHeader>
                                        <TableHeader>Roles</TableHeader>
                                        <TableHeader>Projects</TableHeader>
                                        <div />
                                    </div>

                                    {paginatedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="grid grid-cols-[56px_2.2fr_2fr_2fr_44px] items-center border-b border-app-border px-5 py-5 transition-colors last:border-b-0 hover:bg-app-surface-hover"
                                        >
                                            <div className="flex items-center">
                                                <SelectionCheckbox
                                                    checked={selectedUserIds.has(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    ariaLabel={`Select ${getDisplayName(user)}`}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => openUserDetails(user)}
                                                className="min-w-0 text-left"
                                            >
                                                <div className="truncate text-sm font-semibold text-app-text">
                                                    {getDisplayName(user)}
                                                </div>
                                                <div className="truncate text-sm text-app-text-muted">
                                                    {user.email}
                                                </div>
                                            </button>

                                            <RoleList roles={user.roles} />

                                            <ProjectList projects={user.projects} />

                                            <button
                                                type="button"
                                                onClick={() => openUserDetails(user)}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
                                                aria-label={`Open details for ${getDisplayName(user)}`}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 p-3 lg:hidden">
                                    {paginatedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="rounded-2xl border border-app-border bg-app-surface p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <SelectionCheckbox
                                                    checked={selectedUserIds.has(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    ariaLabel={`Select ${getDisplayName(user)}`}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => openUserDetails(user)}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <div className="truncate text-sm font-semibold text-app-text">
                                                        {getDisplayName(user)}
                                                    </div>
                                                    <div className="truncate text-sm text-app-text-muted">
                                                        {user.email}
                                                    </div>

                                                    <div className="mt-4">
                                                        <div className="mb-2 text-xs text-app-text-disabled">
                                                            Roles
                                                        </div>
                                                        <RoleList roles={user.roles} max={3} />
                                                    </div>

                                                    <div className="mt-4">
                                                        <div className="mb-2 text-xs text-app-text-disabled">
                                                            Projects
                                                        </div>
                                                        <ProjectList projects={user.projects} max={3} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {loadingState === "success" && totalPages > 1 && (
                        <div className="mt-5 flex items-center justify-center gap-2">
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                                (pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        type="button"
                                        onClick={() => setPage(pageNumber)}
                                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                            page === pageNumber
                                                ? "bg-app-surface-muted text-app-text"
                                                : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </section>
            </div>

            {selectedUser && (
                <>
                    <button
                        type="button"
                        aria-label="Close user details overlay"
                        onClick={closeUserDetails}
                        className={`fixed inset-0 z-30 bg-app-overlay transition-opacity duration-300 ${
                            isDrawerOpen ? "opacity-100" : "opacity-0"
                        }`}
                    />

                    <UserDetailsDrawer
                        user={selectedUser}
                        availableRoles={availableRoles}
                        availableProjects={availableProjects}
                        isOpen={isDrawerOpen}
                        isSaving={savingUserId === selectedUser.id}
                        onClose={closeUserDetails}
                        onSaveRoles={handleSaveRoles}
                    />
                </>
            )}
        </div>
    );
}
