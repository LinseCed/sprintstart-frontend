// ============================================================
// AdminPage.tsx
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight, Edit,
    ExternalLink,
    FileText,
    Folder,
    Layers,
    Loader2,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal, Terminal,
    Trash2,
    Users,
} from "lucide-react";
import {
    adminUserService,
    type AdminUser,
    type ProjectSummary,
} from "../services/adminUserService";
import {
    projectService,
    type AdminProject as ProjectOverview,
    type AdminProjectDetails,
    type ProjectSource,
    type ProjectUser,
    type ProjectUserSummary,
} from "../services/projectService";
import { DetailsSideDrawer } from "../components/layout/DetailsSideDrawer.tsx";

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
    children: ReactNode;
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
            {checked && <Check className="h-4 w-4 stroke-3" />}
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

function PermissionGroupBadge({ permissionGroup }: { permissionGroup: string }) {
    return (
        <div className="flex min-w-0 items-center">
            <AccessBadge variant={getPermissionGroupVariant(permissionGroup)}>
                {permissionGroup}
            </AccessBadge>
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
                className={`wrap-break-word text-sm font-medium text-app-text ${
                    mono ? "font-mono text-xs" : ""
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function Section({
                     children,
                 }: {
    children: ReactNode;
}) {
    return (
        <section className="mt-10 border-t border-app-border pt-8 first:mt-0 first:border-t-0 first:pt-0">
            {children}
        </section>
    );
}

function ProjectAccessPanel({
                                assignedProjects,
                                availableProjects,
                                onOpenProjectDetails,
                            }: {
    assignedProjects: ProjectSummary[];
    availableProjects: ProjectSummary[];
    onOpenProjectDetails: (projectId: string) => void;
}) {
    const [draftProjectIds, setDraftProjectIds] = useState<Set<string>>(
        new Set(assignedProjects.map((project) => project.id)),
    );
    const [projectSearch, setProjectSearch] = useState("");
    const [openProjectPicker, setOpenProjectPicker] = useState(false);

    useEffect(() => {
        setDraftProjectIds(new Set(assignedProjects.map((project) => project.id)));
        setProjectSearch("");
        setOpenProjectPicker(false);
    }, [assignedProjects]);

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

        setProjectSearch("");
        setOpenProjectPicker(false);
    };

    const removeProject = (projectId: string) => {
        setDraftProjectIds((current) => {
            const next = new Set(current);
            next.delete(projectId);
            return next;
        });
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

            <div className="grid gap-3 lg:grid-cols-2">
                {assignedDraftProjects.length > 0 ? (
                    assignedDraftProjects.map((project) => (
                        <div
                            key={project.id}
                            className="rounded-2xl border border-app-border bg-app-surface px-4 py-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-surface-muted text-app-text-muted">
                                        <Folder className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-app-text">
                                            {project.name}
                                        </p>
                                        <p className="mt-1 break-all font-mono text-xs text-app-text-muted">
                                            {project.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onOpenProjectDetails(project.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-disabled transition-colors hover:bg-app-brand-soft hover:text-app-brand-text"
                                        aria-label={`Open ${project.name} project details`}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeProject(project.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-disabled transition-colors hover:bg-app-danger-bg hover:text-app-danger-text"
                                        aria-label={`Remove ${project.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface px-4 py-8 text-center lg:col-span-2">
                        <p className="text-sm font-medium text-app-text">
                            No projects assigned
                        </p>
                        <p className="mt-1 text-sm text-app-text-muted">
                            Add a project to assign this user to a project.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

type UserDetailsDrawerProps = {
    user: AdminUser;
    availableProjects: ProjectSummary[];
    isOpen: boolean;
    onClose: () => void;
    onOpenProjectDetails: (projectId: string) => void;
};

function UserDetailsDrawer({
                               user,
                               availableProjects,
                               isOpen,
                               onClose,
                               onOpenProjectDetails,
                           }: UserDetailsDrawerProps) {
    const keycloakAdminBaseUrl = import.meta.env.VITE_KEYCLOAK_ADMIN_BASE_URL as string;
    const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM as string;
    const keycloakUserDetailsUrl = `${keycloakAdminBaseUrl}/admin/${keycloakRealm}/console/#/${keycloakRealm}/users/${user.id}/settings`;

    return (
        <DetailsSideDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={getDisplayName(user)}
            leading={
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface text-lg font-semibold text-app-brand-text shadow-sm">
                    {getInitials(user)}
                </div>
            }
            badge={
                <AccessBadge variant={getPermissionGroupVariant(user.permissionGroup)}>
                    {user.permissionGroup}
                </AccessBadge>
            }
            actions={
                <a
                    href={keycloakUserDetailsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                >
                    <Edit className="h-4 w-4" />
                    Edit User
                </a>
            }
        >
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

            <Section>
                <dl>
                    <DetailRow label="Email" value={user.email} />
                    <DetailRow label="Username" value={user.username} />
                    <DetailRow label="First name" value={user.firstName} />
                    <DetailRow label="Last name" value={user.lastName} />
                    <DetailRow label="Role" value={user.permissionGroup} />
                    <DetailRow label="User ID" value={user.id} mono />
                </dl>
            </Section>

            <Section>
                <ProjectAccessPanel
                    assignedProjects={user.projects}
                    availableProjects={availableProjects}
                    onOpenProjectDetails={onOpenProjectDetails}
                />
            </Section>
        </DetailsSideDrawer>
    );
}

type AdminTab = "users" | "projects";


function getSourceStatusVariant(
    status: string,
): "success" | "brand" | "warning" | "neutral" | "danger" {
    const normalizedStatus = status.trim().toUpperCase();

    if (normalizedStatus === "CONNECTED") return "success";
    if (normalizedStatus === "INDEXING") return "warning";
    if (normalizedStatus === "ERROR") return "danger";
    if (normalizedStatus === "DISCONNECTED") return "neutral";

    return "brand";
}

function SourceStatusBadge({ status }: { status: string }) {
    return <AccessBadge variant={getSourceStatusVariant(status)}>{status}</AccessBadge>;
}


function getProjectUsersCount(project: { users: unknown[] }) {
    return project.users.length;
}

function getProjectSourcesCount(project: { sources: unknown[] }) {
    return project.sources.length;
}

function RoleBadgeList({
                           roles,
                           variant = "neutral",
                       }: {
    roles: string[];
    variant?: "success" | "brand" | "warning" | "neutral" | "danger";
}) {
    if (roles.length === 0) {
        return <span className="text-sm text-app-text-muted">No roles</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
                <AccessBadge key={role} variant={variant}>
                    {role}
                </AccessBadge>
            ))}
        </div>
    );
}

function SourceList({ sources }: { sources: ProjectSource[] }) {
    if (sources.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-6 text-center">
                <FileText className="mx-auto mb-2 h-5 w-5 text-app-text-disabled" />
                <p className="text-sm text-app-text-muted">No sources connected yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {sources.map((source) => (
                <div
                    key={source.id}
                    className="rounded-xl border border-app-border bg-app-surface-muted p-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-app-text">
                                {source.name}
                            </p>
                            <p className="mt-1 font-mono text-xs text-app-text-muted">
                                {source.type}
                            </p>
                        </div>

                        <SourceStatusBadge status={source.status} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProjectUserList({
                             users,
                         }: {
    users: Array<ProjectUser | ProjectUserSummary>;
}) {
    if (users.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-6 text-center">
                <Users className="mx-auto mb-2 h-5 w-5 text-app-text-disabled" />
                <p className="text-sm text-app-text-muted">No users assigned yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {users.map((user) => {
                const displayName =
                    "firstName" in user && "lastName" in user
                        ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                        user.username ||
                        user.email
                        : user.username || user.email;
                const globalRoles = "roles" in user ? user.roles : [];

                return (
                    <div
                        key={user.id}
                        className="rounded-xl border border-app-border bg-app-surface-muted p-4"
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-app-text">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-app-text-muted">
                                    {user.email}
                                </p>
                            </div>

                            {"enabled" in user && (
                                <StatusDot active={user.enabled} />
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                    Global roles
                                </p>
                                <RoleBadgeList roles={globalRoles} variant="neutral" />
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                    Project roles
                                </p>
                                <RoleBadgeList roles={user.projectRoles} variant="brand" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function StatusDot({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-block h-2 w-2 rounded-full ${
                active ? "bg-app-success-solid" : "bg-app-danger-solid"
            }`}
        />
    );
}

function TabSwitcher({
                         activeTab,
                         onChange,
                     }: {
    activeTab: AdminTab;
    onChange: (tab: AdminTab) => void;
}) {
    return (
        <div className="flex gap-1 rounded-2xl border border-app-border bg-app-surface-muted p-1">
            <button
                type="button"
                onClick={() => onChange("users")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "users"
                        ? "bg-app-surface text-app-text shadow-sm"
                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                }`}
            >
                <Users className="h-4 w-4" />
                Users
            </button>

            <button
                type="button"
                onClick={() => onChange("projects")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "projects"
                        ? "bg-app-surface text-app-text shadow-sm"
                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                }`}
            >
                <Layers className="h-4 w-4" />
                Projects
            </button>
        </div>
    );
}

function ProjectDetailsDrawer({
                                  project,
                                  isOpen,
                                  onClose,
                              }: {
    project: ProjectOverview;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [projectDetails, setProjectDetails] = useState<AdminProjectDetails | null>(null);
    const [detailsLoadingState, setDetailsLoadingState] =
        useState<LoadingState>("idle");
    const [detailsErrorMessage, setDetailsErrorMessage] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        async function loadProjectDetails() {
            setDetailsLoadingState("loading");
            setDetailsErrorMessage("");

            try {
                const nextProjectDetails = await projectService.getProjectById(project.id);

                if (!isMounted) return;

                setProjectDetails(nextProjectDetails);
                setDetailsLoadingState("success");
            } catch (error) {
                if (!isMounted) return;

                setProjectDetails(null);
                setDetailsLoadingState("error");
                setDetailsErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Project details could not be loaded.",
                );
            }
        }

        void loadProjectDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, project.id]);

    useEffect(() => {
        setProjectDetails(null);
        setDetailsLoadingState("idle");
        setDetailsErrorMessage("");
    }, [project.id]);

    const visibleProject = projectDetails ?? project;
    const memberCount = getProjectUsersCount(visibleProject);
    const sourceCount = getProjectSourcesCount(visibleProject);
    const isLoadingDetails = detailsLoadingState === "loading" && !projectDetails;
    const hasDetailsError = detailsLoadingState === "error";

    return (
        <DetailsSideDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={visibleProject.name}
            closeAriaLabel="Close project details"
            widthClassName="w-[min(94vw,34rem)] lg:w-[min(72vw,58rem)]"
            leading={
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-surface-muted text-app-text-muted">
                    <Folder className="h-6 w-6" />
                </div>
            }
            badge={
                <>
                    <AccessBadge variant={"neutral"}>
                        {memberCount > 0 ? `${sourceCount} members` : "No members"}
                    </AccessBadge>
                    <AccessBadge variant={sourceCount > 0 ? "success" : "neutral"}>
                        {sourceCount > 0 ? `${sourceCount} sources` : "No sources"}
                    </AccessBadge>
                </>
            }
        >
            {isLoadingDetails ? (
                <div className="flex min-h-72 items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-app-text-muted">
                        <Loader2 className="h-7 w-7 animate-spin text-app-brand" />
                        <p className="text-sm">Loading project details...</p>
                    </div>
                </div>
            ) : hasDetailsError ? (
                <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-app-danger-text">
                        <AlertCircle className="h-4 w-4" />
                        Project details could not be loaded
                    </div>
                    <p className="text-sm text-app-danger-text">{detailsErrorMessage}</p>
                </div>
            ) : (
                <>
                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Description
                        </p>
                        <p className="text-sm leading-relaxed text-app-text-muted">
                            {visibleProject.description || "No project description available yet."}
                        </p>
                    </Section>


                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Connected sources
                        </p>
                        <SourceList sources={visibleProject.sources} />
                    </Section>

                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Assigned users
                        </p>
                        <ProjectUserList users={visibleProject.users} />
                    </Section>
                </>
            )}
        </DetailsSideDrawer>
    );
}

export function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("users");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
        new Set(),
    );
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [projects, setProjects] = useState<ProjectOverview[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectOverview | null>(
        null,
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [loadingState, setLoadingState] = useState<LoadingState>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [searchValue, setSearchValue] = useState("");
    const [projectSearchValue, setProjectSearchValue] = useState("");
    const [userFilter, setUserFilter] = useState<UserFilter>("all");
    const [showFilters, setShowFilters] = useState(false);

    const [page, setPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);

    const loadAdminData = useCallback(async () => {
        setLoadingState((current) => (current === "idle" ? "loading" : current));
        setErrorMessage("");

        try {
            const [nextUsers, nextProjects] = await Promise.all([
                adminUserService.getUsers(),
                projectService.getProjects(),
            ]);

            setUsers(nextUsers);
            setProjects(nextProjects);
            setLoadingState("success");

            setSelectedUser((currentSelectedUser) => {
                if (!currentSelectedUser) return null;

                return (
                    nextUsers.find((user) => user.id === currentSelectedUser.id) ??
                    currentSelectedUser
                );
            });

            setSelectedProject((currentSelectedProject) => {
                if (!currentSelectedProject) return null;

                return (
                    nextProjects.find(
                        (project) => project.id === currentSelectedProject.id,
                    ) ?? currentSelectedProject
                );
            });
        } catch (error) {
            setLoadingState("error");
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Admin data could not be loaded.",
            );
        }
    }, []);

    useEffect(() => {
        void loadAdminData();
    }, [loadAdminData]);

    useEffect(() => {
        if (!selectedUser && !selectedProject) {
            setIsDrawerOpen(false);
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            setIsDrawerOpen(true);
        });

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [selectedUser, selectedProject]);

    const availableProjects = useMemo<ProjectSummary[]>(() => {
        return projects
            .map((project) => ({
                id: project.id,
                name: project.name,
            }))
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [projects]);

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

    const filteredProjects = useMemo(() => {
        const normalizedSearch = projectSearchValue.trim().toLowerCase();

        return projects.filter((project) => {
            const searchableValues = [
                project.id,
                project.name,
                project.description,
                ...project.sources.flatMap((source) => [
                    source.id,
                    source.name,
                    source.type,
                    source.status,
                ]),
                ...project.users.flatMap((user) => [
                    user.id,
                    user.username,
                    user.email,
                    ...user.projectRoles,
                ]),
            ];

            return (
                normalizedSearch.length === 0 ||
                searchableValues.some((value) =>
                    value.toLowerCase().includes(normalizedSearch),
                )
            );
        });
    }, [projects, projectSearchValue]);

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
        setOpenUserMenuId(null);
        setSelectedProject(null);
        setSelectedUser(user);
    };

    const toggleUserContextMenu = (
        event: MouseEvent<HTMLButtonElement>,
        userId: string,
    ) => {
        event.stopPropagation();
        setOpenUserMenuId((currentUserMenuId) =>
            currentUserMenuId === userId ? null : userId,
        );
    };

    const openUserDetailsFromMenu = (
        event: MouseEvent<HTMLButtonElement>,
        user: AdminUser,
    ) => {
        event.stopPropagation();
        openUserDetails(user);
    };

    const handleDeleteUserFromMenu = async (
        event: MouseEvent<HTMLButtonElement>,
        userId: string,
    ) => {
        event.stopPropagation();
        setOpenUserMenuId(null);

        const userServiceWithDelete = adminUserService as typeof adminUserService & {
            deleteUser?: (userId: string) => Promise<void>;
        };

        if (!userServiceWithDelete.deleteUser) return;

        await userServiceWithDelete.deleteUser(userId);
        setUsers((currentUsers) =>
            currentUsers.filter((currentUser) => currentUser.id !== userId),
        );
        setSelectedUserIds((currentSelectedUserIds) => {
            const nextSelectedUserIds = new Set(currentSelectedUserIds);
            nextSelectedUserIds.delete(userId);
            return nextSelectedUserIds;
        });
    };

    const openProjectDetails = (project: ProjectOverview) => {
        setOpenUserMenuId(null);
        setSelectedUser(null);
        setSelectedProject(project);
    };

    const openProjectDetailsFromUserDrawer = (projectId: string) => {
        const project = projects.find((currentProject) => currentProject.id === projectId);

        if (!project) return;

        setOpenUserMenuId(null);
        setActiveTab("projects");
        setProjectSearchValue("");
        setSelectedUser(null);
        setSelectedProject(project);
        setIsDrawerOpen(true);
    };

    const closeDetails = () => {
        setOpenUserMenuId(null);
        setIsDrawerOpen(false);

        window.setTimeout(() => {
            setSelectedUser(null);
            setSelectedProject(null);
        }, DRAWER_CLOSE_DELAY_MS);
    };

    const handleTabChange = (tab: AdminTab) => {
        setOpenUserMenuId(null);
        closeDetails();
        setActiveTab(tab);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);

        try {
            await loadAdminData();
        } finally {
            setIsRefreshing(false);
        }
    };

    const showInitialLoading =
        loadingState === "idle" || loadingState === "loading";

    const renderUsersTab = () => {
        if (paginatedUsers.length === 0) {
            return (
                <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
                    <p className="text-base font-medium text-app-text">No users found</p>
                    <p className="mt-1 text-sm text-app-text-muted">
                        Try another search term or change the filters.
                    </p>
                </div>
            );
        }

        return (
            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
                <div className="hidden lg:block">
                    <div className="grid grid-cols-[44px_2.5fr_1.8fr_1.8fr_52px] items-center border-b border-app-border bg-app-surface-muted px-5 py-3.5">
                        <div className="flex items-center">
                            <SelectionCheckbox
                                checked={allVisibleUsersSelected}
                                onChange={toggleAllVisibleUsers}
                                ariaLabel="Select all users"
                            />
                        </div>

                        <TableHeader>User</TableHeader>
                        <TableHeader>Permission</TableHeader>
                        <TableHeader>Projects</TableHeader>
                        <div />
                    </div>

                    {paginatedUsers.map((user) => (
                        <div
                            key={user.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openUserDetails(user)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openUserDetails(user);
                                }
                            }}
                            className="group grid cursor-pointer grid-cols-[44px_2.5fr_1.8fr_1.8fr_52px] items-center border-b border-app-border px-5 py-4 transition-colors last:border-b-0 hover:bg-app-surface-hover focus:outline-none focus-visible:bg-app-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-brand-glow"
                        >
                            <div
                                className="flex items-center"
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                            >
                                <SelectionCheckbox
                                    checked={selectedUserIds.has(user.id)}
                                    onChange={() => toggleUserSelection(user.id)}
                                    ariaLabel={`Select ${getDisplayName(user)}`}
                                />
                            </div>

                            <div className="min-h-11 min-w-0 text-left">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface-muted text-xs font-semibold text-app-brand-text">
                                        {getInitials(user)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-app-text">
                                                {getDisplayName(user)}
                                            </span>
                                        </div>
                                        <div className="truncate text-xs text-app-text-muted">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <PermissionGroupBadge permissionGroup={user.permissionGroup} />

                            <ProjectList projects={user.projects} />

                            <div
                                className="relative flex items-center justify-end"
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={(event) => toggleUserContextMenu(event, user.id)}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
                                    aria-label={`Open context menu for ${getDisplayName(user)}`}
                                    aria-haspopup="menu"
                                    aria-expanded={openUserMenuId === user.id}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>

                                {openUserMenuId === user.id && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xl"
                                    >
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={(event) => openUserDetailsFromMenu(event, user)}
                                            className="flex min-h-11 w-full items-center px-4 text-left text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                        >
                                            Open details
                                        </button>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={(event) => void handleDeleteUserFromMenu(event, user.id)}
                                            className="flex min-h-11 w-full items-center px-4 text-left text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-bg"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 p-3 lg:hidden">
                    {paginatedUsers.map((user) => (
                        <div
                            key={user.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openUserDetails(user)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openUserDetails(user);
                                }
                            }}
                            className="cursor-pointer rounded-2xl border border-app-border bg-app-surface p-4 transition-colors hover:bg-app-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-app-brand-glow"
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    onClick={(event) => event.stopPropagation()}
                                    onKeyDown={(event) => event.stopPropagation()}
                                >
                                    <SelectionCheckbox
                                        checked={selectedUserIds.has(user.id)}
                                        onChange={() => toggleUserSelection(user.id)}
                                        ariaLabel={`Select ${getDisplayName(user)}`}
                                    />
                                </div>

                                <div className="min-h-11 min-w-0 flex-1 text-left">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-semibold text-app-text">
                                                    {getDisplayName(user)}
                                                </span>
                                                <StatusDot active={user.enabled} />
                                            </div>
                                            <div className="truncate text-xs text-app-text-muted">
                                                {user.email}
                                            </div>
                                        </div>

                                        <div
                                            className="relative shrink-0"
                                            onClick={(event) => event.stopPropagation()}
                                            onKeyDown={(event) => event.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onClick={(event) => toggleUserContextMenu(event, user.id)}
                                                className="flex h-11 w-11 items-center justify-center rounded-xl text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
                                                aria-label={`Open context menu for ${getDisplayName(user)}`}
                                                aria-haspopup="menu"
                                                aria-expanded={openUserMenuId === user.id}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {openUserMenuId === user.id && (
                                                <div
                                                    role="menu"
                                                    className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xl"
                                                >
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={(event) => openUserDetailsFromMenu(event, user)}
                                                        className="flex min-h-11 w-full items-center px-4 text-left text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                                    >
                                                        Open details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={(event) => void handleDeleteUserFromMenu(event, user.id)}
                                                        className="flex min-h-11 w-full items-center px-4 text-left text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-bg"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-2 text-xs text-app-text-disabled">
                                            Permission
                                        </div>
                                        <PermissionGroupBadge permissionGroup={user.permissionGroup} />
                                    </div>

                                    <div className="mt-4">
                                        <div className="mb-2 text-xs text-app-text-disabled">
                                            Projects
                                        </div>
                                        <ProjectList projects={user.projects} max={3} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderProjectsTab = () => {
        if (filteredProjects.length === 0) {
            return (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-app-border bg-app-surface px-6 text-center">
                    <p className="text-base font-medium text-app-text">
                        No projects found
                    </p>
                    <p className="mt-1 text-sm text-app-text-muted">
                        Try another search term or create a new project first.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {filteredProjects.map((project) => {
                    const visibleSources = project.sources.slice(0, 3);

                    return (
                        <button
                            key={project.id}
                            type="button"
                            onClick={() => openProjectDetails(project)}
                            className="group flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-5 text-left transition-colors hover:border-app-border-strong hover:bg-app-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-app-brand-glow sm:flex-row sm:items-start sm:justify-between"
                            aria-label={`Open details for ${project.name}`}
                        >
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-surface-muted text-app-text-muted">
                                    <Folder className="h-5 w-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-app-text">
                                            {project.name}
                                        </span>
                                    </div>


                                    <p className="line-clamp-2 text-sm leading-relaxed text-app-text-muted">
                                        {project.description || "No project description available yet."}
                                    </p>

                                    {visibleSources.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {visibleSources.map((source) => (
                                                <AccessBadge key={source.id} variant="neutral">
                                                    {source.type}
                                                </AccessBadge>
                                            ))}

                                            {project.sources.length > visibleSources.length && (
                                                <AccessBadge variant="neutral">
                                                    +{project.sources.length - visibleSources.length}
                                                </AccessBadge>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-app-text-disabled">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" />
                                            {getProjectUsersCount(project)} members
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" />
                                            {getProjectSourcesCount(project)} sources
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl text-app-text-muted transition-colors group-hover:text-app-text sm:self-center">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-dvh overflow-y-scroll overscroll-contain bg-app-bg px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-app-border bg-app-surface text-app-brand shadow-sm">
                                <Terminal className="h-5 w-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-app-text sm:text-3xl">
                                    Admin Console
                                </h1>
                                <p className="text-sm text-app-text-muted">
                                    Manage users & projects
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3 py-2">
                                <Users className="h-4 w-4 text-app-text-muted" />
                                <span className="text-sm font-semibold text-app-text">
                                    {users.length}
                                </span>
                                <span className="text-sm text-app-text-muted">users</span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3 py-2">
                                <Layers className="h-4 w-4 text-app-text-muted" />
                                <span className="text-sm font-semibold text-app-text">
                                    {projects.length}
                                </span>
                                <span className="text-sm text-app-text-muted">projects</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-app-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <TabSwitcher activeTab={activeTab} onChange={handleTabChange} />

                        <button
                            type="button"
                            onClick={() => void handleRefresh()}
                            disabled={isRefreshing}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Refresh admin data"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                        </button>
                    </div>

                    <div className="p-6">
                        {showInitialLoading ? (
                            <div className="flex min-h-96 items-center justify-center">
                                <div className="flex flex-col items-center gap-3 text-app-text-muted">
                                    <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                                    <p className="text-sm">Loading admin data...</p>
                                </div>
                            </div>
                        ) : loadingState === "error" ? (
                            <div className="flex min-h-96 items-center justify-center px-6 text-center">
                                <div className="max-w-md">
                                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-app-danger-solid" />
                                    <h3 className="text-base font-semibold text-app-text">
                                        Admin data could not be loaded
                                    </h3>
                                    <p className="mt-2 text-sm text-app-text-muted">
                                        {errorMessage}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void handleRefresh()}
                                        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-app-text px-5 py-2.5 text-sm font-medium text-app-text-inverse transition-colors hover:opacity-90"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        ) : activeTab === "users" ? (
                            <>
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-app-text">
                                            {filteredUsers.length} users
                                        </span>
                                        {selectedUserIds.size > 0 && (
                                            <span className="text-sm text-app-brand-text">
                                                {selectedUserIds.size} selected
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-disabled" />
                                            <input
                                                value={searchValue}
                                                onChange={(event) => {
                                                    setSearchValue(event.target.value);
                                                    setPage(1);
                                                }}
                                                placeholder="Search users..."
                                                className="h-11 w-full rounded-xl border border-app-border bg-app-surface pl-10 pr-4 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                                            />
                                        </div>

                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowFilters((current) => !current)}
                                                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
                                                    userFilter !== "all"
                                                        ? "border-app-brand-border bg-app-brand-soft text-app-brand-text"
                                                        : "border-app-border bg-app-surface text-app-text hover:bg-app-surface-hover"
                                                }`}
                                            >
                                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                                Filter
                                            </button>

                                            {showFilters && (
                                                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xl">
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
                                                            className={`flex min-h-11 w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                                                                userFilter === value
                                                                    ? "bg-app-brand-soft text-app-brand-text"
                                                                    : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                                                            }`}
                                                        >
                                                            {label}
                                                            {userFilter === value && (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {renderUsersTab()}

                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                            disabled={page === 1}
                                            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-app-text-muted"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, index) => index + 1,
                                        ).map((pageNumber) => (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setPage(pageNumber)}
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                                                    page === pageNumber
                                                        ? "bg-app-surface-muted text-app-text"
                                                        : "text-app-text-muted hover:bg-app-surface-hover hover:text-app-text"
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                                            disabled={page === totalPages}
                                            className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-app-text-muted"
                                            aria-label="Next page"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-sm font-semibold text-app-text">
                                        {filteredProjects.length} projects
                                    </span>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-disabled" />
                                            <input
                                                value={projectSearchValue}
                                                onChange={(event) =>
                                                    setProjectSearchValue(event.target.value)
                                                }
                                                placeholder="Search projects..."
                                                className="h-11 w-full rounded-xl border border-app-border bg-app-surface pl-10 pr-4 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-brand bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:border-app-brand-hover hover:bg-app-brand-hover"
                                        >
                                            <Plus className="h-4 w-4" />
                                            New Project
                                        </button>
                                    </div>
                                </div>

                                {renderProjectsTab()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {(selectedUser || selectedProject) && (
                <button
                    type="button"
                    aria-label="Close details overlay"
                    onClick={closeDetails}
                    className={`fixed inset-0 z-30 bg-app-overlay transition-opacity duration-300 ${
                        isDrawerOpen ? "opacity-100" : "opacity-0"
                    }`}
                />
            )}

            {selectedUser && (
                <UserDetailsDrawer
                    user={selectedUser}
                    availableProjects={availableProjects}
                    isOpen={isDrawerOpen}
                    onClose={closeDetails}
                    onOpenProjectDetails={openProjectDetailsFromUserDrawer}
                />
            )}

            {selectedProject && (
                <ProjectDetailsDrawer
                    project={selectedProject}
                    isOpen={isDrawerOpen}
                    onClose={closeDetails}
                />
            )}
        </div>
    );
}
