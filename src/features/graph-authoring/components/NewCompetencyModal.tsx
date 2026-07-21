import { useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { CompetencyKind, CreateCompetencyInput } from '../types';

const KINDS: CompetencyKind[] = [
    'SKILL',
    'CONCEPT',
    'CONTRIBUTION',
    'POLICY',
    'CONNECTION',
    'CULTURE',
    'CHECKPOINT'
];

const LEVEL_LABELS: Record<number, string> = {
    1: '1 · beginner',
    2: '2 · intermediate',
    3: '3 · advanced',
    4: '4 · expert'
};

/**
 * The same slugification the backend applies, run locally so the PM sees the key they'll actually
 * get *before* they submit. It is only a preview — the server slugifies again and its result wins.
 */
function slugify(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

type NewCompetencyModalProps = {
    isSaving: boolean;
    /** The last create error, rendered in place rather than as a toast. */
    error: string | null;
    onClearError: () => void;
    onCreate: (input: CreateCompetencyInput) => Promise<boolean>;
    onClose: () => void;
};

/**
 * A PM hand-authoring a brand-new competency node, with no AI proposal.
 *
 * The origination counterpart to the review queue: until this existed a node's only way in was to
 * approve something the AI generated, so AI was mandatory to *start* a graph even though editing
 * afterwards was free. Here a PM types a node from nothing.
 *
 * Two deliberate touches: the key is editable here (creation is the one moment identity is set, and
 * it can never change afterwards), and a live preview shows the slug it will become, so "Docker
 * Compose" visibly resolving to `docker-compose` is not a surprise on save.
 */
export function NewCompetencyModal({
    isSaving,
    error,
    onClearError,
    onCreate,
    onClose
}: NewCompetencyModalProps) {
    const [label, setLabel] = useState('');
    const [key, setKey] = useState('');
    // Until the PM edits the key by hand, it tracks the label — the common case is that the name is
    // the identity. Once touched, it stops following, so their intent isn't overwritten.
    const [keyTouched, setKeyTouched] = useState(false);
    const [description, setDescription] = useState('');
    const [kind, setKind] = useState<CompetencyKind>('SKILL');
    const [targetLevel, setTargetLevel] = useState(2);
    const [invariant, setInvariant] = useState(false);

    const effectiveKey = keyTouched ? key : label;
    const keyPreview = useMemo(() => slugify(effectiveKey), [effectiveKey]);
    const canSave = label.trim().length > 0 && keyPreview.length > 0 && !isSaving;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSave) return;
        const created = await onCreate({
            key: effectiveKey,
            label: label.trim(),
            description: description.trim() || undefined,
            kind,
            targetLevel,
            invariant
        });
        if (created) onClose();
    };

    return (
        <div
            role="dialog"
            aria-label="Add a competency"
            data-testid="new-competency-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4"
        >
            <form
                onSubmit={event => void handleSubmit(event)}
                className="flex max-h-full w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border border-app-border bg-app-bg p-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-app-text">Add a competency</h2>
                        <p className="mt-1 text-sm text-app-text-muted">
                            Author a node by hand. The AI is optional — this joins the same graph its
                            proposals do, and you can connect and edit it afterwards.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={() => {
                            onClearError();
                            onClose();
                        }}
                        className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div>
                    <label
                        htmlFor="new-competency-label"
                        className="mb-1 block text-xs font-medium text-app-text"
                    >
                        Name
                    </label>
                    <input
                        id="new-competency-label"
                        value={label}
                        onChange={event => setLabel(event.target.value)}
                        placeholder="e.g. Docker Compose"
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    />
                </div>

                <div>
                    <label
                        htmlFor="new-competency-key"
                        className="mb-1 block text-xs font-medium text-app-text"
                    >
                        Identifier
                    </label>
                    <input
                        id="new-competency-key"
                        value={effectiveKey}
                        onChange={event => {
                            setKeyTouched(true);
                            setKey(event.target.value);
                        }}
                        placeholder="docker-compose"
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    />
                    <p className="mt-1 text-xs text-app-text-subtle">
                        {keyPreview ? (
                            <>
                                Saved as <code className="text-app-text-muted">{keyPreview}</code>.
                                This is the node&apos;s permanent identity — everyone&apos;s progress
                                is filed under it, so it can&apos;t change later.
                            </>
                        ) : (
                            'The node’s permanent identity. Give it a name or an identifier to continue.'
                        )}
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="new-competency-description"
                        className="mb-1 block text-xs font-medium text-app-text"
                    >
                        Description
                    </label>
                    <textarea
                        id="new-competency-description"
                        rows={3}
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="new-competency-kind"
                            className="mb-1 block text-xs font-medium text-app-text"
                        >
                            Kind
                        </label>
                        <select
                            id="new-competency-kind"
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
                            htmlFor="new-competency-target-level"
                            className="mb-1 block text-xs font-medium text-app-text"
                        >
                            Bar to meet
                        </label>
                        <select
                            id="new-competency-target-level"
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

                <label className="flex items-start gap-2 text-xs text-app-text">
                    <input
                        type="checkbox"
                        checked={invariant}
                        onChange={event => setInvariant(event.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-app-border"
                    />
                    <span>
                        Mandatory
                        <span className="block text-app-text-subtle">
                            Changes to this node reach every hire straight away, without waiting for
                            their next session.
                        </span>
                    </span>
                </label>

                {error && (
                    <p
                        data-testid="new-competency-error"
                        className="rounded-lg bg-app-danger-bg p-2.5 text-xs font-medium text-app-danger-text"
                    >
                        {error}
                    </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="submit"
                        data-testid="create-competency"
                        disabled={!canSave}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        Add to graph
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClearError();
                            onClose();
                        }}
                        className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
