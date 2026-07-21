import { useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { CompetencyNodeEditor, type CompetencyEditInput } from './CompetencyNodeEditor';
import { PrerequisiteEditor } from './PrerequisiteEditor';
import { ModuleAuthoringSection } from './ModuleAuthoringSection';
import { BaselineSection } from './BaselineSection';
import type {
    BaselineEntry,
    CompetencyProposal,
    LiveCompetency,
    LiveGraph,
    SetBaselineEntryInput,
} from '../types';
import type { ModuleReadiness } from '../hooks/useModuleAuthoring';

type StudioNodePanelProps = {
    competency: LiveCompetency;
    graph: LiveGraph;
    /** Set when the selected node is a proposal rather than a live competency. */
    proposal?: CompetencyProposal | null;
    readiness: ModuleReadiness;
    /** False when no project is selected, so module authoring has no scope. */
    canAuthorModules: boolean;
    isSaving: boolean;
    editError: string | null;
    onClearEditError: () => void;
    onSave: (input: CompetencyEditInput) => Promise<boolean>;
    onDelete: () => Promise<boolean>;
    onAddPrerequisite: (fromKey: string, toKey: string) => Promise<boolean>;
    onRemovePrerequisite: (fromKey: string, toKey: string) => Promise<boolean>;
    onSelectKey: (key: string) => void;
    onClose: () => void;
    moduleReadinessProps: {
        isBusy: boolean;
        error: string | null;
        onOpenModule: (moduleId: string) => void;
        onCreate: (mode: 'blank' | 'ai') => void;
    };
    /** Direct baseline authoring for the selected project; null when no project is scoped. */
    baselineProps: {
        entry: BaselineEntry | null;
        isBusy: boolean;
        error: string | null;
        onSetExpected: (input: SetBaselineEntryInput) => void;
        onRemove: () => void;
    } | null;
    /** Approve/reject for a selected proposal, so a PM can decide it on the canvas. */
    onApproveProposal?: (id: string) => void;
    onRejectProposal?: (id: string) => void;
};

/**
 * The studio's inspector for one node: what it is, what it connects to, and everything a PM can
 * change about it.
 *
 * The hire's equivalent (`NodeDetailPanel`) answers "why is this locked for me". This one answers
 * "is this node finished" — its metadata, its prerequisites, and whether anything has been
 * written for it in this project. There is no per-user state here at all, because the graph has
 * none.
 *
 * A selected *proposal* shows the same shape but with approve/reject instead of editing: a
 * proposal has no live row to edit yet.
 */
export function StudioNodePanel({
    competency,
    graph,
    proposal = null,
    readiness,
    canAuthorModules,
    isSaving,
    editError,
    onClearEditError,
    onSave,
    onDelete,
    onAddPrerequisite,
    onRemovePrerequisite,
    onSelectKey,
    onClose,
    moduleReadinessProps,
    baselineProps,
    onApproveProposal,
    onRejectProposal
}: StudioNodePanelProps) {
    const [isEditing, setIsEditing] = useState(false);

    const unlocks = graph.edges
        .filter(edge => edge.fromKey === competency.key)
        .map(edge => graph.competencies.find(node => node.key === edge.toKey))
        .filter((node): node is LiveCompetency => node !== undefined);

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

            {proposal ? (
                <section
                    data-testid="studio-proposal-actions"
                    className="space-y-3 rounded-2xl border border-app-brand-border bg-app-brand-soft p-3"
                >
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-app-brand-text">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Proposed by the AI
                    </p>
                    {competency.description && (
                        <p className="text-sm text-app-text">{competency.description}</p>
                    )}
                    <p className="text-xs text-app-text-muted">
                        Nothing is editable until it is part of the graph. Approving adds it; the
                        graph version bumps and hires pick it up at their next session.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            data-testid="studio-approve-proposal"
                            onClick={() => onApproveProposal?.(proposal.id)}
                            className="flex-1 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            data-testid="studio-reject-proposal"
                            onClick={() => onRejectProposal?.(proposal.id)}
                            className="flex-1 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                        >
                            Reject
                        </button>
                    </div>
                </section>
            ) : (
                <>
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

                    {unlocks.length > 0 && (
                        <section>
                            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                Unlocks
                            </h3>
                            <ul className="space-y-1">
                                {unlocks.map(node => (
                                    <li key={node.key}>
                                        <button
                                            type="button"
                                            onClick={() => onSelectKey(node.key)}
                                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-app-brand-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                        >
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                            {node.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {canAuthorModules ? (
                        <ModuleAuthoringSection
                            competency={competency}
                            readiness={readiness}
                            isBusy={moduleReadinessProps.isBusy}
                            error={moduleReadinessProps.error}
                            onOpenModule={moduleReadinessProps.onOpenModule}
                            onCreate={moduleReadinessProps.onCreate}
                        />
                    ) : (
                        <p className="text-xs text-app-text-subtle">
                            Pick a project above to author this competency&apos;s module — the graph
                            is shared, but a module is written against one project&apos;s corpus.
                        </p>
                    )}

                    {baselineProps && (
                        <BaselineSection
                            competency={competency}
                            entry={baselineProps.entry}
                            isBusy={baselineProps.isBusy}
                            error={baselineProps.error}
                            onSetExpected={baselineProps.onSetExpected}
                            onRemove={baselineProps.onRemove}
                        />
                    )}

                    {isEditing ? (
                        <CompetencyNodeEditor
                            competencyKey={competency.key}
                            isSaving={isSaving}
                            error={editError}
                            onClearError={onClearEditError}
                            onSave={onSave}
                            onDelete={async () => {
                                const removed = await onDelete();
                                // The node is gone, so the panel describing it has nothing left
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

                    {!isEditing && (
                        <PrerequisiteEditor
                            competency={competency}
                            graph={graph}
                            isSaving={isSaving}
                            error={editError}
                            onClearError={onClearEditError}
                            onAdd={onAddPrerequisite}
                            onRemove={onRemovePrerequisite}
                        />
                    )}
                </>
            )}
        </aside>
    );
}
