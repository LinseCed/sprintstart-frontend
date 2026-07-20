import { useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { LiveCompetency, LiveGraph } from '../types';

type PrerequisiteEditorProps = {
    competency: LiveCompetency;
    graph: LiveGraph;
    isSaving: boolean;
    error: string | null;
    onClearError: () => void;
    onAdd: (fromKey: string, toKey: string) => Promise<boolean>;
    onRemove: (fromKey: string, toKey: string) => Promise<boolean>;
};

/**
 * Add and remove this competency's prerequisites, by name.
 *
 * The canvas has a natural gesture for this (drag one node onto another), but a drag is not a
 * path everyone can take. This is the equivalent that works everywhere: a select of candidate
 * nodes and an × on each existing link.
 *
 * Candidates exclude the competency itself and anything already linked. They deliberately do
 * *not* exclude nodes that would form a cycle: working that out here would duplicate the
 * backend's traversal and could disagree with it. The backend rejects the cycle and names both
 * ends, and that message is shown right here — which is the "fail visibly at the point of the
 * gesture" this needs, without a second implementation of the rule that could drift.
 */
export function PrerequisiteEditor({
    competency,
    graph,
    isSaving,
    error,
    onClearError,
    onAdd,
    onRemove
}: PrerequisiteEditorProps) {
    const [pendingKey, setPendingKey] = useState('');

    const prerequisites = useMemo(
        () =>
            graph.edges
                .filter(edge => edge.toKey === competency.key)
                .map(edge => graph.competencies.find(candidate => candidate.key === edge.fromKey))
                .filter((candidate): candidate is LiveCompetency => candidate !== undefined),
        [graph, competency.key]
    );

    const candidates = useMemo(() => {
        const taken = new Set(prerequisites.map(prerequisite => prerequisite.key));
        return graph.competencies
            .filter(candidate => candidate.key !== competency.key && !taken.has(candidate.key))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [graph.competencies, prerequisites, competency.key]);

    const handleAdd = async () => {
        if (!pendingKey) return;
        const added = await onAdd(pendingKey, competency.key);
        if (added) setPendingKey('');
    };

    return (
        <section aria-label={`Prerequisites for ${competency.label}`} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                Prerequisites
            </h3>

            {prerequisites.length === 0 ? (
                <p className="text-xs text-app-text-subtle">None — this is a starting point.</p>
            ) : (
                <ul className="space-y-1">
                    {prerequisites.map(prerequisite => (
                        <li
                            key={prerequisite.key}
                            className="flex items-center justify-between gap-2 rounded-lg bg-app-surface-muted px-2.5 py-1.5"
                        >
                            <span className="min-w-0 truncate text-sm text-app-text">
                                {prerequisite.label}
                            </span>
                            <button
                                type="button"
                                disabled={isSaving}
                                aria-label={`Remove ${prerequisite.label} as a prerequisite`}
                                onClick={() => void onRemove(prerequisite.key, competency.key)}
                                className="shrink-0 rounded-md p-1 text-app-text-muted transition-colors hover:bg-app-danger-bg hover:text-app-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {candidates.length > 0 && (
                <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor="add-prerequisite">
                        Add a prerequisite for {competency.label}
                    </label>
                    <select
                        id="add-prerequisite"
                        value={pendingKey}
                        onChange={event => {
                            onClearError();
                            setPendingKey(event.target.value);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <option value="">Add a prerequisite…</option>
                        {candidates.map(candidate => (
                            <option key={candidate.key} value={candidate.key}>
                                {candidate.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        data-testid="add-prerequisite"
                        disabled={!pendingKey || isSaving}
                        onClick={() => void handleAdd()}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-app-border px-2.5 py-1.5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Add
                    </button>
                </div>
            )}

            {error && (
                <p
                    data-testid="prerequisite-error"
                    className="rounded-lg bg-app-danger-bg p-2.5 text-xs font-medium text-app-danger-text"
                >
                    {error}
                </p>
            )}

            <p className="text-xs text-app-text-subtle">
                Prerequisite changes reach each hire at their next session, not immediately.
            </p>
        </section>
    );
}
