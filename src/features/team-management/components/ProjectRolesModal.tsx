import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    createProjectRole,
    getProjectRoles,
} from '../../../services/teamManagementService';
import type { ProjectRole } from '../types';

type ProjectRolesModalProps = {
    open: boolean;
    onClose: () => void;
};

export function ProjectRolesModal({
    open,
    onClose,
}: ProjectRolesModalProps) {
    const [roles, setRoles] = useState<ProjectRole[]>([]);
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');

    useEffect(() => {
        if (!open) return;

        async function loadRoles() {
            const data = await getProjectRoles();
            setRoles(data);
        }

        void loadRoles();
    }, [open]);

    async function handleCreateRole() {
        if (!roleName.trim()) return;

        const newRole = await createProjectRole(
            roleName.trim(),
            roleDescription.trim()
        );

        setRoles((current) => [...current, newRole]);

        setRoleName('');
        setRoleDescription('');
    }

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-app-text">
                        Project Roles
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-hover"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-8 border-t border-app-border pt-6">
                    <h3 className="mb-3 text-sm font-medium text-app-text">
                        Create New Role
                    </h3>

                    <div className="space-y-3">
                        <input
                            value={roleName}
                            onChange={(event) =>
                                setRoleName(event.target.value)
                            }
                            placeholder="Role name"
                            className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand-border-strong"
                        />

                        <textarea
                            value={roleDescription}
                            onChange={(event) =>
                                setRoleDescription(event.target.value)
                            }
                            placeholder="Description"
                            rows={3}
                            className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand-border-strong"
                        />
                    </div>

                    <div className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-app-text">
                        Existing Roles
                    </h3>

                    <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="rounded-xl border border-app-border bg-app-bg px-3 py-2"
                            >
                                <p className="truncate text-sm font-medium text-app-text">
                                    {role.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-app-border px-4 py-2 text-sm text-app-text-muted hover:bg-app-surface-hover"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleCreateRole()}
                            className="rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white hover:bg-app-brand-hover"
                        >
                            Create Role
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}