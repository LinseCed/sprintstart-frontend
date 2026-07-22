import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Copy, Loader2, Plus, Users } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ModulePageEditor } from '../features/competency-module/components/ModulePageEditor';
import { useModuleEditor } from '../features/competency-module/hooks/useModuleEditor';
import { KNOWN_MODULE_PAGE_KINDS } from '../features/competency-module/types';
import type { ModulePageKind, ModuleStatus } from '../features/competency-module/types';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';

const STATUS_LABELS: Record<ModuleStatus, string> = {
    DRAFT: 'Draft',
    PROPOSED: 'Awaiting review',
    ACTIVE: 'Live',
    ARCHIVED: 'Archived'
};

/**
 * The authoring surface for the module a competency teaches.
 *
 * This is a **publishing** surface, not a document editor: one module serves every
 * hire who needs that competency, so an edit here is not a private draft and
 * publishing is what changes what people are taught. The copy says so, because
 * from the editor alone it looks like editing a page.
 *
 * A live or archived version is never edited in place -- it is the record of what
 * earlier hires were actually taught. Changing it means starting a new version.
 */
export function ModuleEditorPage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const canAct = profile?.permissionGroup !== PermissionGroup.HR;

    const {
        module,
        isLoading,
        isSaving,
        error,
        addPage,
        updatePage,
        deletePage,
        movePage,
        approve,
        startNewVersion
    } = useModuleEditor(moduleId ?? null);

    const [newPageKind, setNewPageKind] = useState<ModulePageKind>('LESSON');

    const isEditable = module ? module.status === 'DRAFT' || module.status === 'PROPOSED' : false;
    const aiPageCount = module?.pages.filter(page => page.provenance === 'AI').length ?? 0;

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame space-y-4 py-6">
                    <button
                        type="button"
                        onClick={() => void navigate('/graph-studio')}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to the studio
                    </button>

                    {module && (
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-semibold text-app-text">
                                        {module.title}
                                    </h1>
                                    <Badge
                                        variant={module.status === 'ACTIVE' ? 'success' : 'neutral'}
                                    >
                                        {STATUS_LABELS[module.status]}
                                    </Badge>
                                    <span className="text-xs text-app-text-subtle">
                                        v{module.version}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-app-text-muted">
                                    Teaches <strong>{module.competencyLabel}</strong>.
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-app-text-subtle">
                                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                    Everyone who needs this competency reads this module &mdash;
                                    there is no per-person copy.
                                </p>
                            </div>

                            {canAct && module.status !== 'ACTIVE' && module.status !== 'ARCHIVED' && (
                                <button
                                    type="button"
                                    onClick={() => void approve()}
                                    disabled={isSaving || module.pages.length === 0}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Check className="h-4 w-4" />
                                    Publish to everyone
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="app-page-frame space-y-4 py-6 lg:py-8">
                {error && (
                    <p
                        role="alert"
                        className="flex items-start gap-2 rounded-2xl border border-app-danger-border bg-app-surface p-4 text-sm text-app-danger-solid"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {error}
                    </p>
                )}

                {isLoading && (
                    <p className="flex items-center gap-2 p-8 text-sm text-app-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading this module...
                    </p>
                )}

                {!isLoading && module && !isEditable && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface-muted p-4">
                        <p className="text-sm text-app-text-muted">
                            This version is {STATUS_LABELS[module.status].toLowerCase()} &mdash; it is
                            the record of what hires were taught, so it is read-only. Start a new
                            version to change it.
                        </p>
                        {canAct && (
                            <button
                                type="button"
                                data-testid="start-new-version"
                                disabled={isSaving}
                                onClick={() =>
                                    void startNewVersion().then(draftId => {
                                        if (draftId) void navigate(`/competency-modules/${draftId}`);
                                    })
                                }
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                Start a new version
                            </button>
                        )}
                    </div>
                )}

                {!isLoading && module && aiPageCount > 0 && (
                    <p className="rounded-2xl border border-app-border bg-app-surface-muted p-4 text-xs text-app-text-muted">
                        {aiPageCount} of {module.pages.length} page
                        {module.pages.length === 1 ? '' : 's'} are still AI drafts. Regenerating this
                        module would rewrite those and leave anything you have edited untouched.
                    </p>
                )}

                {!isLoading && module?.pages.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
                        <h2 className="text-lg font-semibold text-app-text">No pages yet</h2>
                        <p className="mx-auto mt-2 max-w-lg text-sm text-app-text-muted">
                            A module needs at least one page before it can be published.
                        </p>
                    </div>
                )}

                {module?.pages.map((page, index) => (
                    <ModulePageEditor
                        // Remount on the server's version so a reload after a save
                        // replaces the editor's seeded state instead of keeping a stale draft.
                        key={`${page.id}-${page.updatedAt}`}
                        page={page}
                        canAct={canAct && isEditable}
                        isFirst={index === 0}
                        isLast={index === module.pages.length - 1}
                        onSave={input => void updatePage(page.id, input)}
                        onDelete={() => void deletePage(page.id)}
                        onMove={offset => void movePage(page.id, offset)}
                    />
                ))}

                {canAct && isEditable && module && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-app-border p-4">
                        <label>
                            <span className="sr-only">Kind of page to add</span>
                            <select
                                value={newPageKind}
                                onChange={event => setNewPageKind(event.target.value)}
                                className="rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                {KNOWN_MODULE_PAGE_KINDS.map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => void addPage(newPageKind, 'New page')}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:opacity-60"
                        >
                            <Plus className="h-4 w-4" />
                            Add page
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
