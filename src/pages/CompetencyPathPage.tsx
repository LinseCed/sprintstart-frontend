import { useState } from 'react';
import { AlertCircle, Map, RefreshCw, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { AssessmentPathView } from '../features/skill-assessment/components/AssessmentPathView';
import { useCompetencyPath } from '../features/skill-assessment/hooks/useCompetencyPath';
import { LearnVerifyModuleModal } from '../features/learn-verify/components/LearnVerifyModuleModal';
import type { PathNode } from '../features/skill-assessment/types';

/**
 * A persistent, revisitable view of the authenticated user's competency path
 * -- where they've mastered, what's available next, and what's still locked
 * behind unmet prerequisites.
 */
export function CompetencyPathPage() {
    const { path, isLoading, error, pathUpdated, retry } = useCompetencyPath();
    const [noticeDismissed, setNoticeDismissed] = useState(false);
    const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);

    const closeModule = ({ submittedAttempt }: { submittedAttempt: boolean; passed: boolean }) => {
        setSelectedNode(null);
        if (submittedAttempt) {
            void retry();
        }
    };

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-app-bg p-8">
                <div className="max-w-md text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-app-danger-solid" />
                    <h2 className="mb-2 text-xl font-semibold text-app-text">
                        Something went wrong
                    </h2>
                    <p className="mb-6 text-sm text-app-text-muted">{error}</p>
                    <button
                        onClick={() => void retry()}
                        className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg">
            <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
                <div className="app-page-content py-4">
                    <PageHeader
                        icon={Map}
                        title="Your competency path"
                        subtitle="Nodes you've mastered are already yours; available nodes are ready to start; locked nodes are waiting on a prerequisite."
                    />
                </div>
            </div>

            {pathUpdated && !noticeDismissed && (
                <div className="app-page-content mt-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface-muted p-4">
                        <RefreshCw className="h-4 w-4 shrink-0 text-app-brand-text" />
                        <p className="flex-1 text-sm text-app-text">
                            Your path was updated since you last checked it.
                        </p>
                        <button
                            aria-label="Dismiss notice"
                            onClick={() => setNoticeDismissed(true)}
                            className="text-app-text-muted transition-colors hover:text-app-text"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
                </div>
            ) : (
                path && <AssessmentPathView path={path} onSelectNode={setSelectedNode} />
            )}

            {selectedNode && path && (
                <LearnVerifyModuleModal node={selectedNode} path={path} onClose={closeModule} />
            )}
        </div>
    );
}
