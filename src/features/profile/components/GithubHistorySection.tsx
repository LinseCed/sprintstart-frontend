import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, GitPullRequest, Loader2, ShieldCheck } from 'lucide-react';
import {
    githubHistoryService,
    type GithubHistoryPrior
} from '../../../services/githubHistoryService';

type SignalGroup = {
    heading: string;
    entries: { label: string; count: number }[];
};

/**
 * Turns the raw namespaced buckets into something a person can read.
 *
 * The API deliberately returns opaque keys (`repo:owner/api`, `type:PULL_REQUEST`)
 * because they are also the AI service's input; the UI is where they become
 * "Repositories" and "Pull requests". Unknown namespaces are still shown rather
 * than dropped -- hiding part of the record would defeat the point of showing it.
 */
function groupSignals(signals: Record<string, number>): SignalGroup[] {
    const groups = new Map<string, { label: string; count: number }[]>();

    for (const [key, count] of Object.entries(signals)) {
        const separator = key.indexOf(':');
        const namespace = separator === -1 ? 'other' : key.slice(0, separator);
        const value = separator === -1 ? key : key.slice(separator + 1);
        const entries = groups.get(namespace) ?? [];
        entries.push({ label: value.replace(/_/g, ' ').toLowerCase(), count });
        groups.set(namespace, entries);
    }

    const headings: Record<string, string> = {
        repo: 'Repositories',
        type: 'Kind of work',
        label: 'Issue labels',
        other: 'Other'
    };

    return [...groups.entries()]
        .map(([namespace, entries]) => ({
            heading: headings[namespace] ?? namespace,
            entries: entries.sort((a, b) => b.count - a.count)
        }))
        .sort((a, b) => a.heading.localeCompare(b.heading));
}

/**
 * Consent for using the user's existing work in their projects' repositories to
 * calibrate their skill assessment -- and the full record of what that produced.
 *
 * Opting in is inspectable by design: the panel shows exactly the buckets stored
 * server-side, never the content of the work. Withdrawing deletes them; an
 * assessment placement already made from them is kept, which the copy says
 * explicitly so the choice isn't made on a wrong assumption.
 */
export function GithubHistorySection() {
    const [prior, setPrior] = useState<GithubHistoryPrior | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setPrior(await githubHistoryService.fetchPrior());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load your GitHub history settings.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    const toggleConsent = async () => {
        setIsSaving(true);
        setError(null);
        try {
            if (prior?.consented) {
                await githubHistoryService.revokeConsent();
                setPrior({ consented: false, signals: {}, computedAt: null });
            } else {
                setPrior(await githubHistoryService.grantConsent());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update your choice.');
        } finally {
            setIsSaving(false);
        }
    };

    const groups = prior ? groupSignals(prior.signals) : [];

    return (
        <div
            data-testid="github-history-section"
            className="rounded-xl border border-app-border bg-app-surface p-6 shadow-sm"
        >
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-app-text">
                <ShieldCheck className="h-5 w-5 text-app-brand-text" aria-hidden="true" />
                Use my existing work
            </h2>

            <p className="mb-4 text-sm text-app-text-muted">
                Your skill assessment can start from what you&apos;ve already done in your projects&apos;
                connected repositories, so it doesn&apos;t ask about things you&apos;ve obviously done.
                Only issues and pull requests you opened are counted, only in repositories your
                projects already connected, and nothing you wrote is stored &mdash; just how often
                and where. Turning this off deletes what&apos;s below; an assessment you already
                completed stays as it is.
            </p>

            {isLoading ? (
                <p className="flex items-center gap-2 text-sm text-app-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading...
                </p>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => void toggleConsent()}
                        disabled={isSaving}
                        aria-pressed={prior?.consented ?? false}
                        className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50 ${
                            prior?.consented
                                ? 'border border-app-border bg-app-surface text-app-text hover:bg-app-surface-hover'
                                : 'bg-app-brand text-white hover:bg-app-brand-hover'
                        }`}
                    >
                        {isSaving ? 'Saving...' : prior?.consented ? 'Turn off and delete' : 'Turn on'}
                    </button>

                    {prior?.consented && (
                        <div className="mt-5">
                            <h3 className="mb-2 text-sm font-semibold text-app-text">
                                What we found
                            </h3>

                            {groups.length === 0 ? (
                                <p className="text-sm text-app-text-muted">
                                    Nothing yet &mdash; either you haven&apos;t opened issues or pull
                                    requests in these repositories, or your GitHub username isn&apos;t
                                    set above.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {groups.map((group) => (
                                        <section key={group.heading}>
                                            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                                {group.heading}
                                            </h4>
                                            <ul className="space-y-1">
                                                {group.entries.map((entry) => (
                                                    <li
                                                        key={`${group.heading}-${entry.label}`}
                                                        className="flex items-center justify-between gap-4 text-sm text-app-text"
                                                    >
                                                        <span className="flex min-w-0 items-center gap-1.5">
                                                            <GitPullRequest
                                                                className="h-3.5 w-3.5 shrink-0 text-app-text-subtle"
                                                                aria-hidden="true"
                                                            />
                                                            <span className="truncate">{entry.label}</span>
                                                        </span>
                                                        <span className="shrink-0 text-app-text-muted">
                                                            {entry.count}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {error && (
                <p className="mt-4 flex items-start gap-2 text-sm text-app-danger-solid">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}
