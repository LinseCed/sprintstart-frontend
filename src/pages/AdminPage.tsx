import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
    AlertCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Layers,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Terminal,
    Users,
} from "lucide-react";
import { adminUserService } from "../services/adminUserService";
import { projectService } from "../services/projectService";
import { AlertDialog } from "../components/ui/AlertDialog";
import {
    DRAWER_CLOSE_DELAY_MS,
    PAGE_SIZE,
    USER_FILTER_OPTIONS,
    getDisplayName,
} from "../features/admin/data";
import { ProjectDetailsDrawer } from "../features/admin/components/ProjectDetailsDrawer";
import { ProjectsTab } from "../features/admin/components/ProjectsTab";
import { TabSwitcher } from "../features/admin/components/TabSwitcher";
import { UserDetailsDrawer } from "../features/admin/components/UserDetailsDrawer";
import { UsersTab } from "../features/admin/components/UsersTab";
import type {
    AdminTab,
    AdminUser,
    LoadingState,
    ProjectOverview,
    ProjectSummary,
    UserFilter,
} from "../features/admin/types";

export function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("users");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [projects, setProjects] = useState<ProjectOverview[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectOverview | null>(null);
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
    const [userPendingDelete, setUserPendingDelete] = useState<AdminUser | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [deleteUserErrorMessage, setDeleteUserErrorMessage] = useState("");

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

    const requestUserDelete = (user: AdminUser) => {
        setOpenUserMenuId(null);
        setDeleteUserErrorMessage("");
        setUserPendingDelete(user);
    };

    const requestUserDeleteFromMenu = (
        event: MouseEvent<HTMLButtonElement>,
        user: AdminUser,
    ) => {
        event.stopPropagation();
        requestUserDelete(user);
    };

    const cancelUserDelete = () => {
        if (isDeletingUser) return;

        setUserPendingDelete(null);
        setDeleteUserErrorMessage("");
    };

    const confirmUserDelete = async () => {
        if (!userPendingDelete) return;

        const userId = userPendingDelete.id;

        setIsDeletingUser(true);
        setDeleteUserErrorMessage("");

        try {
            await adminUserService.deleteUser(userId);

            setUsers((currentUsers) =>
                currentUsers.filter((currentUser) => currentUser.id !== userId),
            );
            setSelectedUserIds((currentSelectedUserIds) => {
                const nextSelectedUserIds = new Set(currentSelectedUserIds);
                nextSelectedUserIds.delete(userId);
                return nextSelectedUserIds;
            });

            setSelectedUser((currentSelectedUser) =>
                currentSelectedUser?.id === userId ? null : currentSelectedUser,
            );

            if (selectedUser?.id === userId) {
                setIsDrawerOpen(false);
            }

            setUserPendingDelete(null);
        } catch (error) {
            setDeleteUserErrorMessage(
                error instanceof Error ? error.message : "User could not be deleted.",
            );
        } finally {
            setIsDeletingUser(false);
        }
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

    const handleUserUpdated = useCallback((updatedUser: AdminUser) => {
        setUsers((currentUsers) =>
            currentUsers.map((currentUser) =>
                currentUser.id === updatedUser.id ? updatedUser : currentUser,
            ),
        );
        setSelectedUser((currentSelectedUser) =>
            currentSelectedUser?.id === updatedUser.id
                ? updatedUser
                : currentSelectedUser,
        );
    }, []);

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

    const showInitialLoading = loadingState === "idle" || loadingState === "loading";

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
                                                    {USER_FILTER_OPTIONS.map(({ value, label }) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => {
                                                                setUserFilter(value);
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

                                <UsersTab
                                    paginatedUsers={paginatedUsers}
                                    selectedUserIds={selectedUserIds}
                                    allVisibleUsersSelected={allVisibleUsersSelected}
                                    openUserMenuId={openUserMenuId}
                                    onToggleAllVisibleUsers={toggleAllVisibleUsers}
                                    onToggleUserSelection={toggleUserSelection}
                                    onOpenUserDetails={openUserDetails}
                                    onToggleUserContextMenu={toggleUserContextMenu}
                                    onOpenUserDetailsFromMenu={openUserDetailsFromMenu}
                                    onRequestUserDeleteFromMenu={requestUserDeleteFromMenu}
                                />

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

                                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                                            (pageNumber) => (
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
                                            ),
                                        )}

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
                                                onChange={(event) => setProjectSearchValue(event.target.value)}
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

                                <ProjectsTab
                                    filteredProjects={filteredProjects}
                                    onOpenProjectDetails={openProjectDetails}
                                />
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
                    onUserUpdated={handleUserUpdated}
                    onRequestDelete={requestUserDelete}
                />
            )}

            {selectedProject && (
                <ProjectDetailsDrawer
                    project={selectedProject}
                    isOpen={isDrawerOpen}
                    onClose={closeDetails}
                />
            )}

            <AlertDialog
                isOpen={Boolean(userPendingDelete)}
                title="Delete user?"
                description={
                    userPendingDelete ? (
                        <>
                            Are you sure you want to delete <strong>{getDisplayName(userPendingDelete)}</strong>? This action cannot be undone.
                        </>
                    ) : undefined
                }
                confirmLabel="Delete user"
                cancelLabel="Cancel"
                variant="danger"
                isLoading={isDeletingUser}
                loadingLabel="Deleting..."
                errorMessage={deleteUserErrorMessage}
                onClose={cancelUserDelete}
                onConfirm={() => void confirmUserDelete()}
            />
        </div>
    );
}
