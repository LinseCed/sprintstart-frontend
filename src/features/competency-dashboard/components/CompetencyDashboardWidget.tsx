import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Users } from 'lucide-react';
import { competencyDashboardService } from '../../../services/competencyDashboardService';
import { useFetch } from '../../../hooks/useFetch';
import { ClickableCard } from '../../../components/common/ClickableCard';
import { CompetencySourceBar } from './CompetencyBars';

const PREVIEW_COUNT = 4;

/**
 * Compact dashboard-embedded summary of team-wide competency signal, linking
 * to the full paginated view -- same split as `KnowledgeGapWidget`
 * (`PmDashboardPage` widget -> `/insights/knowledge-gaps` full page).
 */
export function CompetencyDashboardWidget() {
    const navigate = useNavigate();

    const { data: aggregate, loading, error } = useFetch(
        () => competencyDashboardService.fetchCompetencyAggregate(),
        []
    );

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-app-border bg-app-surface p-6">
                <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
            </div>
        );
    }

    if (error || !aggregate || aggregate.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-app-border bg-app-surface p-6 text-center">
                <AlertCircle className="h-5 w-5 text-app-text-muted" />
                <p className="text-sm text-app-text-muted">
                    No competency signal yet. It fills in as hires progress.
                </p>
            </div>
        );
    }

    const sorted = [...aggregate].sort((a, b) => b.usersEngaged - a.usersEngaged);
    const preview = sorted.slice(0, PREVIEW_COUNT);

    return (
        <ClickableCard
            onClick={() => void navigate('/insights/competencies')}
            interactive={false}
            className="cursor-pointer rounded-2xl border border-app-border bg-app-surface p-5 transition-colors hover:border-app-brand-border-strong hover:bg-app-surface-hover has-[button:hover]:!border-app-border has-[button:hover]:!bg-app-surface"
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-app-brand" />
                    <span className="text-sm font-semibold text-app-text">Team competency signal</span>
                </div>
                <button
                    type="button"
                    onClick={event => {
                        event.stopPropagation();
                        void navigate('/insights/competencies');
                    }}
                    className="flex items-center gap-1 rounded-lg text-xs text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    See all ({sorted.length})
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="space-y-3">
                {preview.map(competency => (
                    <div key={competency.competencyKey}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-app-text">{competency.label}</span>
                            <span className="shrink-0 text-xs text-app-text-muted">
                                {competency.usersEngaged} engaged
                            </span>
                        </div>
                        <CompetencySourceBar sourceCounts={competency.sourceCounts} />
                    </div>
                ))}
            </div>
        </ClickableCard>
    );
}
