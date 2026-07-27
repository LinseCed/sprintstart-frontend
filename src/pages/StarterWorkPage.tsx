import { useState } from 'react';
import { CheckCircle2, Loader2, Plus, Sparkles, Target, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { StarterWorkTaskCard } from '../features/starter-work/components/StarterWorkTaskCard';
import { NewStarterTaskModal } from '../features/starter-work/components/NewStarterTaskModal';
import { useFetch } from '../hooks/useFetch';
import { trackService } from '../services/trackService';
import { TaskOrientationManager } from '../features/orientation/components/TaskOrientationManager';
import { useStarterWorkReview } from '../features/starter-work/hooks/useStarterWorkReview';
import type { CreateStarterWorkTaskInput } from '../features/starter-work/types';

/**
 * PM-facing review of AI-mined starter work.
 *
 * Approving a task here is the only way a `CONTRIBUTION` node ever enters the competency graph,
 * which makes this the surface that gives hires something to aim at — the same gap the blueprint
 * flow had until the Onboarding Baseline page existed: the backend was complete and the product
 * couldn't reach it.
 *
 * HR reads, `ADMIN`/`PM` decide, matching the split every other proposal queue uses.
 */
export function StarterWorkPage() {
    const { profile } = useAuth();
    const canAct = profile?.permissionGroup !== PermissionGroup.HR;
    const isAdmin = profile?.permissionGroup === PermissionGroup.ADMIN;
    // Loaded here rather than inside the modal so opening the form never waits on a fetch. An
    // empty list degrades to "Any role" only, which is a usable form rather than a broken one.
    const { data: tracks } = useFetch(() => trackService.fetchTracks(), []);
    const {
        tasks,
        isLoading,
        isGenerating,
        error,
        generateResult,
        createdTask,
        generate,
        create,
        dismissCreated,
        approve,
        reject
    } = useStarterWorkReview();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (input: CreateStarterWorkTaskInput): Promise<boolean> => {
        setIsCreating(true);
        const ok = await create(input);
        setIsCreating(false);
        return ok;
    };

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={Target}
                        title="Starter Work"
                        subtitle="Well-scoped first tasks mined from the ingested corpus. Approving one turns it into a goal a hire can work toward — their path becomes the route to shipping it."
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                {canAct && (
                                    <button
                                        type="button"
                                        data-testid="add-starter-task"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add a task
                                    </button>
                                )}
                                <button
                                    type="button"
                                    data-testid="generate-starter-work"
                                    onClick={() => void generate()}
                                    disabled={isGenerating}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {isGenerating ? 'Mining...' : 'Find starter tasks'}
                                </button>
                            </div>
                        }
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
                {createdTask && (
                    <div
                        data-testid="created-task-confirmation"
                        className="flex items-start gap-3 rounded-2xl border border-app-success-border bg-app-success-bg p-4 text-sm text-app-success-text"
                    >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p className="flex-1">
                            <strong>“{createdTask.title}”</strong> is now a goal in the graph — it
                            skipped review because you authored it. It won&apos;t appear in the queue
                            below; hires can aim at it straight away.
                        </p>
                        <button
                            type="button"
                            aria-label="Dismiss"
                            onClick={dismissCreated}
                            className="rounded-lg p-1 text-app-success-text transition-colors hover:bg-app-surface-hover"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {generateResult && (
                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-4 text-sm text-app-brand-text">
                        Found {generateResult.tasksProposed} task
                        {generateResult.tasksProposed === 1 ? '' : 's'} for review.
                        {generateResult.notes.length > 0 && (
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {generateResult.notes.map(note => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-4 text-sm text-app-danger-text">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-app-text-muted">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="rounded-3xl border border-app-border bg-app-bg p-10 text-center">
                        <Target className="mx-auto mb-3 h-8 w-8 text-app-text-disabled" />
                        <p className="text-sm text-app-text-muted">
                            Nothing waiting for review. Mine the corpus to find open issues that
                            would make good first contributions.
                        </p>
                    </div>
                ) : (
                    <section className="space-y-3" data-testid="starter-work-queue">
                        {tasks.map(task => (
                            <StarterWorkTaskCard
                                key={task.id}
                                task={task}
                                canAct={canAct}
                                onApprove={approve}
                                onReject={reject}
                            />
                        ))}
                    </section>
                )}

                {/* Authoring a task's orientation is PM/ADMIN only, matching the backend role split —
                    HR reviews the queue but does not write hire-facing content. */}
                {canAct && <TaskOrientationManager isAdmin={isAdmin} />}
            </main>

            {isCreateOpen && (
                <NewStarterTaskModal
                    isSaving={isCreating}
                    error={error}
                    tracks={tracks ?? []}
                    onCreate={handleCreate}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}
        </div>
    );
}
