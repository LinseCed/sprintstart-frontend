import { useState } from 'react';
import { X } from 'lucide-react';
import { CompetencyNodeEditor, type CompetencyEditInput } from './CompetencyNodeEditor';
import { ModuleAuthoringSection } from './ModuleAuthoringSection';
import type { LiveCompetency } from '../types';
import type { ModuleReadiness } from '../hooks/useModuleAuthoring';
import type { AiActivityEntry } from '../../ai-activity/useAiStream';

type StudioNodePanelProps = {
    competency: LiveCompetency;
    /** The areas the vocabulary already uses, so an edit joins one instead of coining a synonym. */
    existingAreas: string[];
    readiness: ModuleReadiness;
    /** False when no project is selected, so module authoring has no scope. */
    canAuthorModules: boolean;
    isSaving: boolean;
    editError: string | null;
    onClearEditError: () => void;
    onSave: (input: CompetencyEditInput) => Promise<boolean>;
    onDelete: () => Promise<boolean>;
    onClose: () => void;
    moduleReadinessProps: {
        isBusy: boolean;
        error: string | null;
        onOpenModule: (moduleId: string) => void;
        onCreate: (mode: 'blank' | 'ai') => void;
        isStreaming?: boolean;
        activity?: AiActivityEntry[];
    };
};

/**
 * The studio's inspector for one competency: what it is, and everything a PM can change about it.
 *
 * Competencies carry no ordering, so what it shows is the competency itself and whether anything
 * has been written to teach it in this project — the half that decides whether a hire gets
 * anything out of it.
 */
export function StudioNodePanel({
    competency,
    existingAreas,
    readiness,
    canAuthorModules,
    isSaving,
    editError,
    onClearEditError,
    onSave,
    onDelete,
    onClose,
    moduleReadinessProps
}: StudioNodePanelProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <aside
            aria-label={`Authoring ${competency.label}`}
            data-testid="studio-node-panel"
            className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-app-border bg-app-surface p-5 lg:w-96 lg:border-l"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-app-text">
                        {competency.label}
                    </h2>
                    <p className="truncate font-mono text-xs text-app-text-subtle" title={competency.key}>
                        {competency.key}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Close panel"
                    onClick={onClose}
                    className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {competency.description && (
                <p className="text-sm text-app-text-muted">{competency.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <dt className="text-app-text-subtle">Kind</dt>
                    <dd className="text-app-text">{competency.kind.toLowerCase()}</dd>
                </div>
                <div>
                    <dt className="text-app-text-subtle">Target level</dt>
                    <dd className="text-app-text">L{competency.targetLevel}</dd>
                </div>
            </dl>

            {canAuthorModules ? (
                <ModuleAuthoringSection
                    competency={competency}
                    readiness={readiness}
                    isBusy={moduleReadinessProps.isBusy}
                    error={moduleReadinessProps.error}
                    onOpenModule={moduleReadinessProps.onOpenModule}
                    onCreate={moduleReadinessProps.onCreate}
                    isStreaming={moduleReadinessProps.isStreaming}
                    activity={moduleReadinessProps.activity}
                />
            ) : (
                <p className="text-xs text-app-text-subtle">
                    Pick a project in the sidebar switcher to author this competency&apos;s module — competencies are
                    shared, but a module is written against one project&apos;s corpus.
                </p>
            )}

            {isEditing ? (
                <CompetencyNodeEditor
                    competencyKey={competency.key}
                    existingAreas={existingAreas}
                    isSaving={isSaving}
                    error={editError}
                    onClearError={onClearEditError}
                    onSave={onSave}
                    onDelete={async () => {
                        const removed = await onDelete();
                        // The competency is gone, so the panel describing it has nothing left
                        // to describe.
                        if (removed) onClose();
                        return removed;
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <button
                    type="button"
                    data-testid="edit-competency"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    Edit this competency
                </button>
            )}
        </aside>
    );
}
