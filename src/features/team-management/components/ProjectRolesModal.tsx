import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProjectRole, Skill } from '../types';
import {
    createProjectRole,
    getProjectRoles,
    createSkill,
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

    // useEffect(() => {
    //     if (!open) return;

    //     async function loadRoles() {
    //         const data = await getProjectRoles();
    //         setRoles(data);
    //     }

    //     void loadRoles();
    // }, [open]);
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

        const newSkill = await createSkill(
            skillName.trim(),
            selectedRole.id
        );

        setSkills((current) => [...current, newSkill]);
        setSkillName('');
    }

    if (!open) {
        return null;
    }

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
                                const isSelected = selectedRole?.id === role.id;

                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(isSelected ? null : role)}
                                        className={`rounded-xl border px-3 py-2 text-left transition ${isSelected
                                            ? 'border-app-brand bg-app-brand/10'
                                            : 'border-app-border bg-app-bg hover:bg-app-surface-hover'
                                            }`}
                                    >
                                        <p className="truncate text-sm font-medium text-app-text">
                                            {role.name}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedRole && (
                            <div className="mt-5 rounded-2xl border border-app-border bg-app-bg p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-app-text">
                                            {selectedRole.name}
                                        </h3>

                                        {selectedRole.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-app-text-muted">
                                                {selectedRole.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="mb-2 text-xs font-medium text-app-text-muted">
                                        Skills
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {skills
                                            .filter((skill) => skill.roleId === selectedRole.id)
                                            .map((skill) => (
                                                <span
                                                    key={skill.id}
                                                    className="rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs text-app-text"
                                                >
                                                    {skill.name}
                                                </span>
                                            ))}

                                        {skills.filter((skill) => skill.roleId === selectedRole.id)
                                            .length === 0 && (
                                                <p className="text-xs text-app-text-muted">
                                                    No skills added yet.
                                                </p>
                                            )}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <input
                                        value={skillName}
                                        onChange={(event) => setSkillName(event.target.value)}
                                        placeholder="Add skill, e.g. React"
                                        className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand-border-strong"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => void handleCreateSkill()}
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
        </div>
    );
}