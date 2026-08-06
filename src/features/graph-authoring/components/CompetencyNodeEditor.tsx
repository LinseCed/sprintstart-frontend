import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Lock, Trash2 } from 'lucide-react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { CompetencyKind, LiveCompetency } from '../types';

const KINDS: CompetencyKind[] = ['SKILL', 'CONCEPT'];

const LEVEL_LABELS: Record<number, string> = {
    1: '1 · beginner',
    2: '2 · intermediate',
    3: '3 · advanced',
    4: '4 · expert'
};

/** Everything this form can change about a competency. The key is not among them. */
export type CompetencyEditInput = {
    label: string;
    description: string;
    kind: CompetencyKind;
    area: string;
    targetLevel: number;
};

type CompetencyNodeEditorProps = {
    competencyKey: string;
    /**
     * The areas already in use, offered as suggestions.
     *
     * Free text with the existing values in reach, rather than a dropdown: a PM naming a subject
     * the vocabulary has never covered must be able to, and one naming a subject it already covers
     * should land on the same spelling. The backend enforces the second half regardless.
     */
    existingAreas: string[];
    isSaving: boolean;
    /** The last write error, rendered in place rather than as a toast. */
    error: string | null;
    onClearError: () => void;
    onSave: (input: CompetencyEditInput) => Promise<boolean>;
    onDelete: () => Promise<boolean>;
    onCancel: () => void;
};

/**
 * The PM's edit form for one competency.
 *
 * Loads the competency's own record rather than editing from whatever a list happened to carry --
 * editing `description` or `targetLevel` from a blank field would mean overwriting a value the PM
 * never saw.
 *
 * Two things are said out loud rather than left to be discovered:
 *
 * - **The key is not editable.** It's shown, disabled, with the reason. Offering a field the
 *   backend rejects would be worse than not offering one.
 * - **Raising the target level un-holds it for people who had met the old bar.** Nothing is
 *   un-earned (the ledger is monotonic and untouched), but "held" is derived against the bar, so
 *   the readout changes for everyone at once. That warning appears only when the level is
 *   actually being raised.
 */
export function CompetencyNodeEditor({
    competencyKey,
    existingAreas,
    isSaving,
    error,
    onClearError,
    onSave,
    onDelete,
    onCancel
}: CompetencyNodeEditorProps) {
    const [competency, setCompetency] = useState<LiveCompetency | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [kind, setKind] = useState<CompetencyKind>('SKILL');
    const [area, setArea] = useState('');
    const [targetLevel, setTargetLevel] = useState(2);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Deferred off the effect body, matching NodeDetailPanel's module-count fetch:
    // setting state synchronously here would cascade a render on every open.
    useEffect(() => {
        let cancelled = false;

        void Promise.resolve().then(async () => {
            if (cancelled) return;
            setCompetency(null);
            setLoadError(null);
            try {
                const loaded = await competencyGraphService.fetchCompetency(competencyKey);
                if (cancelled) return;
                setCompetency(loaded);
                // The form is seeded once from the record, then owned by the PM --
                // re-syncing on every render would fight their typing.
                setLabel(loaded.label);
                setDescription(loaded.description ?? '');
                setKind(loaded.kind);
                setArea(loaded.area ?? '');
                setTargetLevel(loaded.targetLevel);
            } catch (err) {
                if (cancelled) return;
                setLoadError(
                    err instanceof Error ? err.message : 'Could not load this competency.'
                );
            }
        });

        return () => {
            cancelled = true;
        };
    }, [competencyKey]);

    if (loadError) {
        return (
            <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-4 text-sm text-app-danger-text">
                {loadError}
            </div>
        );
    }

    if (!competency) {
        return (
            <div className="flex items-center justify-center py-8 text-app-text-muted">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            </div>
        );
    }

    const isRaisingLevel = targetLevel > competency.targetLevel;
    const canSave = label.trim().length > 0 && !isSaving;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSave) return;
        const saved = await onSave({
            label: label.trim(),
            description,
            kind,
            area,
            targetLevel
        });
        if (saved) onCancel();
    };

    if (confirmingDelete) {
        return (
            <section
                aria-label={`Remove ${competency.label}`}
                className="space-y-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4"
            >
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-app-danger-text">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Remove “{competency.label}”?
                </h3>
                <p className="text-xs text-app-danger-text">
                    It stops being something the buddy can name or a module can hang from.{' '}
                    <strong>Nobody loses a competency they already earned</strong> — levels people
                    have proven stay on their record, any module written for it is kept, and adding
                    it back under the same key brings the module back with it.
                </p>
                {error && <p className="text-xs font-medium text-app-danger-text">{error}</p>}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        data-testid="confirm-delete-competency"
                        disabled={isSaving}
                        onClick={() => void onDelete()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-app-danger-solid px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                        Remove it
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setConfirmingDelete(false);
                            onClearError();
                        }}
                        className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                        Keep it
                    </button>
                </div>
            </section>
        );
    }

    return (
        <form
            aria-label={`Edit ${competency.label}`}
            data-testid="competency-node-editor"
            onSubmit={event => void handleSubmit(event)}
            className="space-y-3 rounded-2xl border border-app-border bg-app-surface-muted p-4"
        >
            <div>
                <label
                    htmlFor="competency-label"
                    className="mb-1 block text-xs font-medium text-app-text"
                >
                    Name
                </label>
                <input
                    id="competency-label"
                    value={label}
                    onChange={event => setLabel(event.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                />
            </div>

            <div>
                <label
                    htmlFor="competency-key"
                    className="mb-1 flex items-center gap-1.5 text-xs font-medium text-app-text"
                >
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    Identifier
                </label>
                <input
                    id="competency-key"
                    value={competency.key}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text-muted"
                />
                <p className="mt-1 text-xs text-app-text-subtle">
                    Fixed. Everyone&apos;s earned progress is filed under it, so it can&apos;t
                    change — rename the node above instead.
                </p>
            </div>

            <div>
                <label
                    htmlFor="competency-description"
                    className="mb-1 block text-xs font-medium text-app-text"
                >
                    Description
                </label>
                <textarea
                    id="competency-description"
                    rows={3}
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                />
            </div>

            <div>
                <label
                    htmlFor="competency-area"
                    className="mb-1 block text-xs font-medium text-app-text"
                >
                    Area
                </label>
                <input
                    id="competency-area"
                    list="competency-area-options"
                    value={area}
                    placeholder="e.g. Authentication"
                    onChange={event => setArea(event.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                />
                <datalist id="competency-area-options">
                    {existingAreas.map(option => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
                <p className="mt-1 text-xs text-app-text-muted">
                    What it is about, so the buddy can offer its neighbours. Leave it empty if
                    nothing fits — a wrong grouping is worse than none.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor="competency-kind"
                        className="mb-1 block text-xs font-medium text-app-text"
                    >
                        Kind
                    </label>
                    <select
                        id="competency-kind"
                        value={kind}
                        onChange={event => setKind(event.target.value as CompetencyKind)}
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {KINDS.map(option => (
                            <option key={option} value={option}>
                                {option.toLowerCase()}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="competency-target-level"
                        className="mb-1 block text-xs font-medium text-app-text"
                    >
                        Bar to meet
                    </label>
                    <select
                        id="competency-target-level"
                        value={targetLevel}
                        onChange={event => setTargetLevel(Number(event.target.value))}
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {[1, 2, 3, 4].map(level => (
                            <option key={level} value={level}>
                                {LEVEL_LABELS[level]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Only shown when it's actually true: raising the bar can un-hold a node for
                someone who met the old one, and that happens for everyone immediately. */}
            {isRaisingLevel && (
                <p
                    data-testid="raise-level-warning"
                    className="flex items-start gap-1.5 rounded-lg bg-app-warning-bg p-2.5 text-xs text-app-warning-text"
                >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Raising the bar from {competency.targetLevel} to {targetLevel} takes effect for
                    everyone right away. Anyone who had met the old bar but not this one counts as
                    not holding it again.
                </p>
            )}

            {error && (
                <p
                    data-testid="node-editor-error"
                    className="rounded-lg bg-app-danger-bg p-2.5 text-xs font-medium text-app-danger-text"
                >
                    {error}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                    type="submit"
                    data-testid="save-competency"
                    disabled={!canSave}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    Save
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onClearError();
                        onCancel();
                    }}
                    className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    data-testid="delete-competency"
                    onClick={() => {
                        onClearError();
                        setConfirmingDelete(true);
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-bg"
                >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                </button>
            </div>
        </form>
    );
}
