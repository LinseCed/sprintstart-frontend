import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
    Skill,
    SkillLevel,
    TeamOverviewUser,
} from '../types';

type SkillSelfAssessmentWizardProps = {
    open: boolean;
    user: TeamOverviewUser;
    skills: Skill[];
    onClose: () => void;
    onSubmit: (skills: Skill[]) => Promise<void> | void;
};

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' },
];

export function SkillWizard({
    open,
    user,
    skills,
    onClose,
    onSubmit,
}: SkillSelfAssessmentWizardProps) {
    const [selectedLevels, setSelectedLevels] = useState<
        Record<string, SkillLevel>
    >({});
    const [saving, setSaving] = useState(false);

    const requiredSkills = useMemo(() => {
        const roleIds = user.roles.map((role) => role.id);

        return skills.filter((skill) => roleIds.includes(skill.roleId));
    }, [skills, user.roles]);

    const allSkillsRated =
        requiredSkills.length > 0 &&
        requiredSkills.every((skill) => selectedLevels[skill.id]);

    async function handleSubmit() {
        if (!allSkillsRated) return;

        setSaving(true);

        await onSubmit(
            requiredSkills.map((skill) => ({
                ...skill,
                level: selectedLevels[skill.id],
            }))
        );

        setSaving(false);
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-app-text">
                            Skill Self Assessment
                        </h2>

                        <p className="mt-1 text-sm text-app-text-muted">
                            Please rate your current level for the skills
                            required by your assigned roles.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-hover"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                    {requiredSkills.length > 0 ? (
                        requiredSkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="rounded-2xl border border-app-border bg-app-surface-muted p-4"
                            >
                                <p className="text-sm font-medium text-app-text">
                                    {skill.name}
                                </p>

                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {SKILL_LEVELS.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() =>
                                                setSelectedLevels((prev) => ({
                                                    ...prev,
                                                    [skill.id]: level.value,
                                                }))
                                            }
                                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${selectedLevels[skill.id] ===
                                                    level.value
                                                    ? 'border-app-brand bg-app-brand-soft text-app-brand'
                                                    : 'border-app-border bg-app-surface text-app-text-muted hover:border-app-brand hover:text-app-brand'
                                                }`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                            No skills found for your assigned roles.
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover"
                    >
                        Later
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={!allSkillsRated || saving}
                        className="rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Save Assessment
                    </button>
                </div>
            </div>
        </div>
    );
}
