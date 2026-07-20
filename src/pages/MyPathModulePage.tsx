import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Lightbulb,
    Loader2,
    XCircle
} from 'lucide-react';
import { ModulePageView } from '../features/competency-module/components/ModulePageView';
import { ModuleStepper } from '../features/competency-module/components/ModuleStepper';
import { useCompetencyModule } from '../features/competency-module/hooks/useCompetencyModule';
import { VerifyInput } from '../features/learn-verify/components/VerifyInput';

/**
 * A single competency module, full-screen and focused: the graph is deliberately
 * gone while you work through it.
 *
 * The module is **shared** -- one per competency and project, read by everybody
 * who needs it. Nothing on this page is private to the reader except their own
 * attempts.
 *
 * Everything the page needs hangs off the `:moduleId` in the URL, so a refresh or
 * a shared deep link lands in the same place -- including the current page, which
 * lives in `?page=<pageId>`. By id rather than index, so a link survives a PM
 * reordering the module; an index would silently point at different content after
 * an edit. On a passing check the user returns to the map with the earned
 * competency key in navigation state, so the map can pulse exactly what changed.
 */
export function MyPathModulePage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        module,
        verification,
        isLoading,
        loadError,
        answer,
        setAnswer,
        latestAttempt,
        passed,
        submitting,
        submitError,
        gradingUnavailable,
        submit
    } = useCompetencyModule(moduleId ?? null);

    const pages = module?.pages ?? [];
    const requestedPageId = searchParams.get('page');
    const activePage = pages.find(page => page.id === requestedPageId) ?? pages[0] ?? null;

    const goToPage = (pageId: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('page', pageId);
        setSearchParams(next, { replace: true });
    };

    const backToMap = (unlockedKey?: string) => {
        void navigate('/my-path', unlockedKey ? { state: { unlockedKey } } : undefined);
    };

    const isVerifyPage = activePage?.kind === 'VERIFY';

    return (
        <div className="flex min-h-screen flex-col bg-app-bg">
            <header className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
                <div className="app-page-content flex flex-col gap-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => backToMap()}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to your path
                        </button>
                    </div>

                    {module && (
                        <div>
                            <h1 className="text-xl font-semibold text-app-text">{module.title}</h1>
                            {module.summary && (
                                <p className="mt-1 text-sm text-app-text-muted">{module.summary}</p>
                            )}
                        </div>
                    )}

                    {pages.length > 0 && (
                        <ModuleStepper
                            pages={pages}
                            activePageId={activePage?.id ?? null}
                            onSelect={goToPage}
                        />
                    )}
                </div>
            </header>

            <main className="app-page-content flex-1 py-8">
                {isLoading && (
                    <div className="flex flex-col items-center gap-3 py-16 text-app-text-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-app-brand" />
                        <p className="text-sm">Loading this module...</p>
                    </div>
                )}

                {loadError && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <AlertCircle className="h-8 w-8 text-app-danger-solid" />
                        <p className="text-sm text-app-text-muted">{loadError}</p>
                    </div>
                )}

                {!isLoading && !loadError && module && pages.length === 0 && (
                    <p className="py-16 text-center text-sm text-app-text-muted">
                        This module has no pages yet.
                    </p>
                )}

                {!isLoading && !loadError && activePage && !isVerifyPage && (
                    <ModulePageView page={activePage} />
                )}

                {!isLoading && !loadError && isVerifyPage && (
                    <div className="max-w-2xl space-y-4">
                        {passed ? (
                            <div
                                data-testid="module-passed"
                                className="flex items-start gap-3 rounded-2xl border border-app-success-border bg-app-success-bg p-4"
                            >
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-app-success-solid" />
                                <div>
                                    <p className="text-sm font-semibold text-app-success-text">
                                        Mastered!
                                    </p>
                                    <p className="mt-0.5 text-xs text-app-text-muted">
                                        This is on your ledger now -- it counts on every project.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => backToMap(verification?.competencyKey)}
                                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                    >
                                        See what it unlocked
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ) : verification ? (
                            <>
                                <p className="text-sm text-app-text">{verification.prompt}</p>
                                <VerifyInput
                                    type={verification.type}
                                    answer={answer}
                                    onAnswerChange={setAnswer}
                                    disabled={submitting}
                                />

                                {latestAttempt && !latestAttempt.passed && (
                                    <div className="rounded-2xl border border-app-danger-border bg-app-surface-muted p-4">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 shrink-0 text-app-danger-solid" />
                                            <p className="text-sm font-medium text-app-text">
                                                Not quite -- attempt {latestAttempt.attemptNo}
                                            </p>
                                        </div>
                                        {latestAttempt.feedback && (
                                            <p className="mt-2 text-xs text-app-text-muted">
                                                {latestAttempt.feedback}
                                            </p>
                                        )}
                                        {latestAttempt.hint && (
                                            <p className="mt-2 flex items-start gap-1.5 text-xs text-app-warning-text">
                                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                {latestAttempt.hint}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {gradingUnavailable && (
                                    <p className="flex items-center gap-2 text-sm text-app-danger-solid">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Grading is temporarily unavailable. Please try again in a
                                        moment.
                                    </p>
                                )}
                                {submitError && (
                                    <p className="flex items-center gap-2 text-sm text-app-danger-solid">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {submitError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={() => void submit()}
                                    disabled={!answer.trim() || submitting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-app-brand px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Submit answer
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-app-text-muted">
                                No check is configured for this module yet.
                            </p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
