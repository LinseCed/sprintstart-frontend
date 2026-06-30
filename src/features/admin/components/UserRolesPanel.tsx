import { useEffect, useState } from "react";
import { Loader2, Plus, Tag, X } from "lucide-react";
import {
    assignProjectRoleToUser,
    getProjectRoles,
    unassignProjectRoleFromUser,
} from "../../../services/teamManagementService";
import type { ProjectRole } from "../../team-management/types";

export type UserRolesPanelProps = {
    userId: string;
    assignedRoles: ProjectRole[];
    onRolesChanged: (roles: ProjectRole[]) => void;
};

export function UserRolesPanel({
    userId,
    assignedRoles,
    onRolesChanged,
}: UserRolesPanelProps) {
    const [availableRoles, setAvailableRoles] = useState<ProjectRole[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        void getProjectRoles().then(setAvailableRoles);
    }, []);

    const unassignedRoles = availableRoles.filter(
        (role) => !assignedRoles.some((assigned) => assigned.id === role.id),
    );

    async function addRole() {
        if (!selectedRoleId) return;

        const roleToAdd = availableRoles.find((role) => role.id === selectedRoleId);
        if (!roleToAdd) return;

        setSavingRoleId(selectedRoleId);
        setError("");

        try {
            await assignProjectRoleToUser(userId, selectedRoleId);
            onRolesChanged([...assignedRoles, roleToAdd]);
            setSelectedRoleId("");
            setPickerOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to assign role.");
        } finally {
            setSavingRoleId(null);
        }
    }

    async function removeRole(roleId: string) {
        setSavingRoleId(roleId);
        setError("");

        try {
            await unassignProjectRoleFromUser(userId, roleId);
            onRolesChanged(assignedRoles.filter((role) => role.id !== roleId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to remove role.");
        } finally {
            setSavingRoleId(null);
        }
    }

    return (
        <div className="rounded-3xl border border-app-border bg-app-surface-muted p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-2xl font-semibold text-app-text">Roles</p>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setPickerOpen((open) => !open)}
                        className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add role
                    </button>

                    {pickerOpen && (
                        <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-app-border bg-app-surface p-2 shadow-xl">
                            <select
                                value={selectedRoleId}
                                onChange={(event) => setSelectedRoleId(event.target.value)}
                                className="mb-2 w-full rounded-xl border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                            >
                                <option value="">Choose role</option>
                                {unassignedRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => void addRole()}
                                disabled={!selectedRoleId || savingRoleId !== null}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingRoleId === selectedRoleId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Assign
                            </button>

                            {unassignedRoles.length === 0 && (
                                <p className="mt-2 px-1 text-xs text-app-text-muted">
                                    All available roles are already assigned.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="mb-3 text-xs text-app-danger-text">{error}</p>}

            <div className="flex flex-wrap gap-2">
                {assignedRoles.length > 0 ? (
                    assignedRoles.map((role) => (
                        <span
                            key={role.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-sm font-medium text-app-text"
                        >
                            <Tag className="h-3.5 w-3.5 text-app-text-muted" />
                            {role.name}
                            <button
                                type="button"
                                onClick={() => void removeRole(role.id)}
                                disabled={savingRoleId === role.id}
                                className="rounded-full p-0.5 text-app-text-disabled transition-colors hover:bg-app-danger-bg hover:text-app-danger-text disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Remove ${role.name}`}
                            >
                                {savingRoleId === role.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <X className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </span>
                    ))
                ) : (
                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface px-4 py-3 text-sm text-app-text-muted">
                        No role assigned yet.
                    </p>
                )}
            </div>
        </div>
    );
}
