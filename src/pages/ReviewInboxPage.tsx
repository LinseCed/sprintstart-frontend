import { AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ReviewInbox } from '../features/review-inbox/components/ReviewInbox';
import { useReviewInbox } from '../features/review-inbox/hooks/useReviewInbox';
import { GENERATION_KINDS, type GenerationKind } from '../features/review-inbox/types';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';

function parseKind(value: string | null): GenerationKind | undefined {
    return GENERATION_KINDS.find((kind) => kind === value);
}

/**
 * One place to review everything the AI proposed — the skill map, the baseline and starter tasks —
 * with one generate control and one approve/reject pattern each. Replaces three separate review
 * screens with three different layouts and three silent generation waits. Reached from the
 * Onboarding Setup ladder; `?kind=` narrows it to the stage a rung deep-links to.
 */
export function ReviewInboxPage() {
    const { profile } = useAuth();
    const [searchParams] = useSearchParams();
    const filterKind = parseKind(searchParams.get('kind'));
    // HR reads the queue; approving is what commits a proposal, so only PM/ADMIN act (also enforced
    // server-side). This only decides who sees the buttons.
    const canAct = profile?.permissionGroup !== PermissionGroup.HR;

    const inbox = useReviewInbox();

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <Link
                        to="/setup"
                        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Onboarding Setup
                    </Link>
                    <PageHeader
                        icon={Sparkles}
                        title="Review proposals"
                        subtitle="Everything the AI has proposed — competencies, prerequisites, the baseline and starter tasks — in one queue. Generating can take about a minute; proposals appear here as they are drafted."
                    />
                </div>
            </header>

            <main className="app-page-frame py-6 lg:py-8">
                {inbox.error && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4">
                        <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                        <p className="text-sm text-app-danger-text">{inbox.error}</p>
                    </div>
                )}

                {inbox.loading ? (
                    <div className="flex items-center justify-center p-16">
                        <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                    </div>
                ) : (
                    <ReviewInbox inbox={inbox} canAct={canAct} filterKind={filterKind} />
                )}
            </main>
        </div>
    );
}
