import type { KeyboardEvent, MouseEvent } from "react";
import { ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import { getDisplayName, getInitials } from "../data";
import type { AdminUser } from "../types";
import { PermissionGroupBadge } from "./Badges";
import { ProjectList } from "./ProjectList";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { StatusDot } from "./StatusDot";
import { TableHeader } from "./TableHeader";

type UsersTabProps = {
    paginatedUsers: AdminUser[];
    selectedUserIds: Set<string>;
    allVisibleUsersSelected: boolean;
    openUserMenuId: string | null;
    onToggleAllVisibleUsers: () => void;
    onToggleUserSelection: (userId: string) => void;
    onOpenUserDetails: (user: AdminUser) => void;
    onToggleUserContextMenu: (event: MouseEvent<HTMLButtonElement>, userId: string) => void;
    onOpenUserDetailsFromMenu: (event: MouseEvent<HTMLButtonElement>, user: AdminUser) => void;
    onRequestUserDeleteFromMenu: (event: MouseEvent<HTMLButtonElement>, user: AdminUser) => void;
};

export function UsersTab({
                             paginatedUsers,
                             selectedUserIds,
                             allVisibleUsersSelected,
                             openUserMenuId,
                             onToggleAllVisibleUsers,
                             onToggleUserSelection,
                             onOpenUserDetails,
                             onToggleUserContextMenu,
                             onOpenUserDetailsFromMenu,
                             onRequestUserDeleteFromMenu,
                         }: UsersTabProps) {
    const shouldIgnoreUserRowAction = (
        event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
    ) => {
        return (
            event.target instanceof Element &&
            event.target.closest("[data-user-row-action='true']") !== null
        );
    };

    const handleOpenUserByClick = (
        event: MouseEvent<HTMLDivElement>,
        user: AdminUser,
    ) => {
        if (shouldIgnoreUserRowAction(event)) return;

        onOpenUserDetails(user);
    };

    const handleOpenUserByKeyboard = (
        event: KeyboardEvent<HTMLDivElement>,
        user: AdminUser,
    ) => {
        if (shouldIgnoreUserRowAction(event)) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenUserDetails(user);
        }
    };

    if (paginatedUsers.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-6">
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
                            onChange={onToggleAllVisibleUsers}
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
                        onClick={(event) => handleOpenUserByClick(event, user)}
                        onKeyDown={(event) => handleOpenUserByKeyboard(event, user)}
                        className="group grid cursor-pointer grid-cols-[44px_2.5fr_1.8fr_1.8fr_52px] items-center border-b border-app-border px-5 py-4 transition-colors last:border-b-0 hover:bg-app-surface-hover focus:outline-none focus-visible:bg-app-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-brand-glow"
                    >
                        <div className="flex items-center" data-user-row-action="true">
                            <SelectionCheckbox
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => onToggleUserSelection(user.id)}
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
                            data-user-row-action="true"
                        >
                            <button
                                type="button"
                                onClick={(event) => onToggleUserContextMenu(event, user.id)}
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
                                        onClick={(event) => onOpenUserDetailsFromMenu(event, user)}
                                        className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Open details
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={(event) => onRequestUserDeleteFromMenu(event, user)}
                                        className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-bg"
                                    >
                                        <Trash2 className="h-4 w-4" />
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
                        onClick={(event) => handleOpenUserByClick(event, user)}
                        onKeyDown={(event) => handleOpenUserByKeyboard(event, user)}
                        className="cursor-pointer rounded-2xl border border-app-border bg-app-surface p-4 transition-colors hover:bg-app-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-app-brand-glow"
                    >
                        <div className="flex items-start gap-3">
                            <div data-user-row-action="true">
                                <SelectionCheckbox
                                    checked={selectedUserIds.has(user.id)}
                                    onChange={() => onToggleUserSelection(user.id)}
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
                                        data-user-row-action="true"
                                    >
                                        <button
                                            type="button"
                                            onClick={(event) => onToggleUserContextMenu(event, user.id)}
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
                                                    onClick={(event) => onOpenUserDetailsFromMenu(event, user)}
                                                    className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Open details
                                                </button>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={(event) => onRequestUserDeleteFromMenu(event, user)}
                                                    className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-bg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
}