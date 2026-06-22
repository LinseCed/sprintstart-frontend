import { useEffect, useState } from 'react';
import { skillsService } from '../../../services/skillsService';
import type { Skill, UserProfile, UserSkill } from '../../../services/types';
import { CheckCircle2 } from 'lucide-react';

type SkillsAssessmentProps = {
    profile: UserProfile;
    onUpdate: (data: Partial<UserProfile>) => Promise<void>;
};

/**
 * Component for users to self-assess their proficiency across various skills.
 * Updates the user profile with the selected skill levels.
 */
export function SkillsAssessment({ profile, onUpdate }: SkillsAssessmentProps) {
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [userSkills, setUserSkills] = useState<UserSkill[]>(profile.skills || []);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        let mounted = true;
        skillsService.getAvailableSkills()
            .then(skills => {
                if (mounted) {
                    setAvailableSkills(skills);
                    setIsLoading(false);
                }
            })
            .catch(err => {
                console.error("Failed to load skills", err);
                if (mounted) setIsLoading(false);
            });
            
        return () => { mounted = false; };
    }, []);

    const handleLevelChange = (skillId: string, level: number) => {
        setUserSkills(prev => {
            const existing = prev.find(s => s.skillId === skillId);
            if (existing) {
                return prev.map(s => s.skillId === skillId ? { ...s, level } : s);
            }
            return [...prev, { skillId, level }];
        });
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate({ skills: userSkills });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse rounded-xl bg-app-surface p-6 shadow-sm h-64"></div>;
    }

    return (
        <div className="rounded-xl border border-app-border bg-app-surface p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-app-text">Skills Self-Assessment</h2>
                    <p className="mt-1 text-sm text-app-text-muted">
                        Rate your proficiency in the following skills from 1 (Beginner) to 5 (Expert).
                    </p>
                </div>
                <button
                    onClick={() => { void handleSave(); }}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-app-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Skills'}
                    {saveSuccess && <CheckCircle2 className="h-4 w-4" />}
                </button>
            </div>

            <div className="space-y-4">
                {availableSkills.length === 0 ? (
                    <div className="text-sm text-app-text-muted italic">No skills configured.</div>
                ) : (
                    availableSkills.map((skill) => {
                        const currentLevel = userSkills.find(s => s.skillId === skill.id)?.level || 0;
                        
                        return (
                            <div key={skill.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-app-border bg-app-bg p-4">
                                <span className="font-medium text-app-text">{skill.name}</span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => handleLevelChange(skill.id, level)}
                                            className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium transition-all ${
                                                currentLevel === level
                                                    ? 'border-app-brand bg-app-brand text-white'
                                                    : 'border-app-border bg-app-surface text-app-text-muted hover:border-app-brand hover:text-app-brand'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
