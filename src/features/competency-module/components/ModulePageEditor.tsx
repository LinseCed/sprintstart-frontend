import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Pencil, Sparkles, Trash2, User } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { ModulePageView } from './ModulePageView';
import { KNOWN_MODULE_PAGE_KINDS } from '../types';
import type { ModulePage, ModulePageKind } from '../types';

type ModulePageEditorProps = {
    page: ModulePage;
    canAct: boolean;
    isFirst: boolean;
    isLast: boolean;
    onSave: (input: { kind?: ModulePageKind; title?: string; body?: string }) => void;
    onDelete: () => void;
    onMove: (offset: number) => void;
};

/**
 * One page, editable in place, with a preview that renders it exactly as the hire
 * will see it -- same component, not a lookalike, so the preview cannot drift.
 *
 * Local edit state is seeded once per mounted page. The parent keys this component
 * on the page's `updatedAt`, so a reload after a save remounts it with the server's
 * version rather than leaving a stale draft on screen.
 *
 * Provenance is shown because it decides what a re-synthesis pass would overwrite:
 * an AI page can be replaced by the next run, a PM page is left alone. An author
 * needs to know which of their work is durable *before* they invest in it.
 */
export function ModulePageEditor({
    page,
    canAct,
    isFirst,
    isLast,
    onSave,
    onDelete,
    onMove
}: ModulePageEditorProps) {
    const [title, setTitle] = useState(page.title);
    const [body, setBody] = useState(page.body ?? '');
    const [kind, setKind] = useState<ModulePageKind>(page.kind);
    const [showPreview, setShowPreview] = useState(false);

    const isDirty = title !== page.title || body !== (page.body ?? '') || kind !== page.kind;

    return (
        <article
            data-testid={`page-editor-${page.id}`}
            className="rounded-2xl border border-app-border bg-app-surface p-4"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-app-text-subtle">#{page.position + 1}</span>
                    <Badge variant={page.provenance === 'PM' ? 'success' : 'neutral'} className="gap-1">
                        {page.provenance === 'PM' ? (
                            <User className="h-3 w-3" />
                        ) : (
                            <Sparkles className="h-3 w-3" />
                        )}
                        {page.provenance === 'PM' ? 'Yours' : 'AI draft'}
                    </Badge>
                </div>

                {canAct && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            aria-label={`Move ${page.title} up`}
                            disabled={isFirst}
                            onClick={() => onMove(-1)}
                            className="rounded-lg border border-app-border p-1.5 text-app-text-muted transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label={`Move ${page.title} down`}
                            disabled={isLast}
                            onClick={() => onMove(1)}
                            className="rounded-lg border border-app-border p-1.5 text-app-text-muted transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label={`Delete ${page.title}`}
                            onClick={onDelete}
                            className="rounded-lg border border-app-border p-1.5 text-app-danger-solid transition-colors hover:bg-app-surface-hover"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {showPreview ? (
                <div className="rounded-xl border border-dashed border-app-border p-4">
                    <ModulePageView page={{ ...page, kind, title, body }} />
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                        <label className="flex-1">
                            <span className="sr-only">Page title</span>
                            <input
                                type="text"
                                value={title}
                                disabled={!canAct}
                                onChange={event => setTitle(event.target.value)}
                                placeholder="Page title"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            />
                        </label>
                        <label>
                            <span className="sr-only">Page kind</span>
                            <select
                                value={kind}
                                disabled={!canAct}
                                onChange={event => setKind(event.target.value)}
                                className="rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                {KNOWN_MODULE_PAGE_KINDS.map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="block">
                        <span className="sr-only">Page body (markdown)</span>
                        <textarea
                            value={body}
                            rows={8}
                            disabled={!canAct}
                            onChange={event => setBody(event.target.value)}
                            placeholder="Markdown"
                            className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        />
                    </label>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowPreview(current => !current)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-3 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover"
                >
                    {showPreview ? (
                        <>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </>
                    ) : (
                        <>
                            <Eye className="h-3.5 w-3.5" /> Preview
                        </>
                    )}
                </button>
                {canAct && (
                    <button
                        type="button"
                        disabled={!isDirty}
                        onClick={() => onSave({ kind, title, body })}
                        className="rounded-xl bg-app-brand px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Save page
                    </button>
                )}
                {isDirty && <span className="text-xs text-app-text-subtle">Unsaved changes</span>}
            </div>
        </article>
    );
}
