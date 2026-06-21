import { Users } from "lucide-react";
import type { ProjectUser, ProjectUserSummary } from "../types";
import { RoleBadgeList } from "./RoleBadgeList";
import { StatusDot } from "./StatusDot";

type ProjectUserListProps = {
    users: Array<ProjectUser | ProjectUserSummary>;
};

export function ProjectUserList({ users }: ProjectUserListProps) {
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

                            {"enabled" in user && <StatusDot active={user.enabled} />}
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
