import { useState } from 'react';
import { AlertCircle, Loader2, Search, Users } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Pagination } from '../../../components/ui/Pagination';
import { competencyDashboardService } from '../../../services/competencyDashboardService';
import { useFetch } from '../../../hooks/useFetch';
import { CompetencyLevelBar, CompetencySourceBar } from './CompetencyBars';
import type { UserCompetencyState } from '../types';

const PAGE_SIZE = 20;

const LEVEL_LABELS: Record<number, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert'
};

function CompetencyChip({ state }: { state: UserCompetencyState }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-surface-muted px-2 py-0.5 text-xs text-app-text-muted">
            {state.label}
            <span className="text-app-text-subtle">
                &middot; {LEVEL_LABELS[state.level] ?? state.level}
            </span>
        </span>
    );
}

const CHIP_PREVIEW_COUNT = 4;

/**
 * Full team-wide competency dashboard for PM/HR/Admin: an aggregate signal
 * per competency (level + source distribution) plus a searchable, paginated
 * per-user ledger breakdown. Sourced from `UserCompetencyState`, so this
 * reflects real assessed/verified/declared competence -- not step completion.
 */
export function CompetencyDashboardPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const {
        data: aggregate,
        loading: aggregateLoading,
        error: aggregateError
    } = useFetch(() => competencyDashboardService.fetchCompetencyAggregate(), []);

    const {
        data: userPage,
        loading: usersLoading,
        error: usersError
    } = useFetch(
        () => competencyDashboardService.fetchUserCompetencySummaries({ search: search || undefined, page, size: PAGE_SIZE }),
        [search, page]
    );

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={Users}
                        title="Competency dashboard"
                        subtitle="Team-wide competency signal from the ledger -- real assessed, verified, or declared competence, not step completion."
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-app-text">Aggregate signal</h2>
                        <p className="text-sm text-app-text-muted">
                            How many engaged users hold each competency, by level and by evidence source.
                        </p>
                    </div>

                    {aggregateLoading ? (
                        <div className="flex min-h-32 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
                        </div>
                    ) : aggregateError || !aggregate || aggregate.length === 0 ? (
                        <p className="py-8 text-center text-sm text-app-text-muted">
                            No competency signal yet. It fills in as hires progress.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {aggregate.map(competency => (
                                <div
                                    key={competency.competencyKey}
                                    className="rounded-2xl border border-app-border bg-app-surface p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium text-app-text">
                                            {competency.label}
                                        </span>
                                        <span className="shrink-0 text-xs text-app-text-muted">
                                            {competency.usersEngaged} engaged
                                        </span>
                                    </div>
                                    <CompetencyLevelBar levelCounts={competency.levelCounts} className="mb-2" />
                                    <CompetencySourceBar sourceCounts={competency.sourceCounts} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-app-text">Per-user ledger</h2>
                            <p className="text-sm text-app-text-muted">Every hire&apos;s full competency breakdown.</p>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-subtle" />
                            <input
                                type="search"
                                value={search}
                                onChange={event => {
                                    setSearch(event.target.value);
                                    setPage(0);
                                }}
                                placeholder="Search users..."
                                aria-label="Search users"
                                className="w-full rounded-xl border border-app-border bg-app-bg py-2 pl-9 pr-3 text-sm text-app-text placeholder:text-app-text-subtle focus:border-app-brand focus:outline-none sm:w-64"
                            />
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="flex min-h-32 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
                        </div>
                    ) : usersError || !userPage ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <AlertCircle className="h-5 w-5 text-app-danger-solid" />
                            <p className="text-sm text-app-text-muted">Could not load the per-user breakdown.</p>
                        </div>
                    ) : userPage.content.length === 0 ? (
                        <p className="py-8 text-center text-sm text-app-text-muted">No users match your search.</p>
                    ) : (
                        <>
                            <ul className="space-y-2">
                                {userPage.content.map(user => (
                                    <li
                                        key={user.userId}
                                        className="rounded-2xl border border-app-border bg-app-surface p-4"
                                    >
                                        <p className="mb-2 text-sm font-medium text-app-text">
                                            {user.firstname} {user.lastname}
                                        </p>
                                        {user.competencies.length === 0 ? (
                                            <p className="text-xs text-app-text-muted">No ledger entries yet.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.competencies.slice(0, CHIP_PREVIEW_COUNT).map(state => (
                                                    <CompetencyChip key={state.competencyKey} state={state} />
                                                ))}
                                                {user.competencies.length > CHIP_PREVIEW_COUNT && (
                                                    <span className="inline-flex items-center rounded-full border border-app-border bg-app-surface-muted px-2 py-0.5 text-xs text-app-text-muted">
                                                        +{user.competencies.length - CHIP_PREVIEW_COUNT} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <Pagination
                                currentPage={userPage.number + 1}
                                totalPages={userPage.totalPages}
                                onPageChange={nextPage => setPage(nextPage - 1)}
                            />
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
