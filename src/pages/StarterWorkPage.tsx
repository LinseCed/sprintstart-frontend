import { Loader2, Sparkles, Target } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { StarterWorkTaskCard } from '../features/starter-work/components/StarterWorkTaskCard';
import { useStarterWorkReview } from '../features/starter-work/hooks/useStarterWorkReview';

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
    const { tasks, isLoading, isGenerating, error, generateResult, generate, approve, reject } =
        useStarterWorkReview();

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={Target}
                        title="Starter Work"
                        subtitle="Well-scoped first tasks mined from the ingested corpus. Approving one turns it into a goal a hire can work toward — their path becomes the route to shipping it."
                        actions={
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
                        }
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
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
            </main>
        </div>
    );
}
