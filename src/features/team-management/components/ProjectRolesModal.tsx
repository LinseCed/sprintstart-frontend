import { Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProjectRole, Skill } from '../types';
import {
    createProjectRole,
    createSkill,
    deleteProjectRole,
    deleteSkill,
    getProjectRoles,
    getSkills,
} from '../../../services/teamManagementService';

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
    const [selectedRole, setSelectedRole] = useState<ProjectRole | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [skillName, setSkillName] = useState('');
    const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
    const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        async function loadData() {
            const [rolesData, skillsData] = await Promise.all([
                getProjectRoles(),
                getSkills(),
            ]);

            setRoles(rolesData);
            setSkills(skillsData);
        }

        void loadData();
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

    async function handleCreateSkill() {
        if (!selectedRole || !skillName.trim()) return;

        const newSkill = await createSkill(skillName.trim(), selectedRole.id);

        setSkills((current) => [...current, newSkill]);
        setSkillName('');
    }

    async function confirmDeleteRole() {
        if (!deleteRoleId) return;

        await deleteProjectRole(deleteRoleId);

        setRoles((current) =>
            current.filter((role) => role.id !== deleteRoleId)
        );

        setSkills((current) =>
            current.filter((skill) => skill.roleId !== deleteRoleId)
        );

        if (selectedRole?.id === deleteRoleId) {
            setSelectedRole(null);
        }

        setDeleteRoleId(null);
    }

    async function confirmDeleteSkill() {
        if (!deleteSkillId) return;

        await deleteSkill(deleteSkillId);

        setSkills((current) =>
            current.filter((skill) => skill.id !== deleteSkillId)
        );

        setDeleteSkillId(null);
    }

    if (!open) {
        return null;
    }

    const selectedRoleSkills = selectedRole
        ? skills.filter((skill) => skill.roleId === selectedRole.id)
        : [];

    const roleToDelete = roles.find((role) => role.id === deleteRoleId);
    const skillToDelete = skills.find((skill) => skill.id === deleteSkillId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
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
                            rows={2}
                            className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand-border-strong"
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 text-sm font-medium text-app-text">
                            Existing Roles
                        </h3>

                        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                            {roles.map((role) => {
                                const isSelected =
                                    selectedRole?.id === role.id;

                                return (
                                    <div
                                        key={role.id}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                                            isSelected
                                                ? 'border-app-brand bg-app-brand/10'
                                                : 'border-app-border bg-app-bg hover:bg-app-surface-hover'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedRole(
                                                    isSelected ? null : role
                                                )
                                            }
                                            className="min-w-0 flex-1 text-left"
                                        >
                                            <p className="truncate text-sm font-medium text-app-text">
                                                {role.name}
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteRoleId(role.id)
                                            }
                                            className="rounded-lg p-1 text-app-text-muted hover:bg-app-surface-hover hover:text-red-500"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedRole && (
                            <div className="mt-5 rounded-2xl border border-app-border bg-app-bg p-4">
                                <h3 className="text-sm font-semibold text-app-text">
                                    {selectedRole.name}
                                </h3>

                                {selectedRole.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-app-text-muted">
                                        {selectedRole.description}
                                    </p>
                                )}

                                <div className="mt-4">
                                    <p className="mb-2 text-xs font-medium text-app-text-muted">
                                        Skills
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {selectedRoleSkills.map((skill) => (
                                            <span
                                                key={skill.id}
                                                className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs text-app-text"
                                            >
                                                {skill.name}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteSkillId(
                                                            skill.id
                                                        )
                                                    }
                                                    className="text-app-text-muted hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}

                                        {selectedRoleSkills.length === 0 && (
                                            <p className="text-xs text-app-text-muted">
                                                No skills added yet.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <input
                                        value={skillName}
                                        onChange={(event) =>
                                            setSkillName(event.target.value)
                                        }
                                        placeholder="Add skill, e.g. React"
                                        className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand-border-strong"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleCreateSkill()
                                        }
                                        className="rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white hover:bg-app-brand-hover"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}
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

            {(deleteRoleId || deleteSkillId) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-app-text">
                            Confirm deletion
                        </h3>

                        <p className="mt-2 text-sm text-app-text-muted">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-app-text">
                                {roleToDelete?.name ??
                                    skillToDelete?.name ??
                                    'this item'}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteRoleId(null);
                                    setDeleteSkillId(null);
                                }}
                                className="rounded-xl border border-app-border px-4 py-2 text-sm text-app-text"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (deleteRoleId) {
                                        void confirmDeleteRole();
                                    }

                                    if (deleteSkillId) {
                                        void confirmDeleteSkill();
                                    }
                                }}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}