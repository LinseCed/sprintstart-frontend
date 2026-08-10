import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { LadderRung, RungState, SetupLadder } from '../types';

type StateStyle = {
    icon: LucideIcon;
    chip: string;
    label: string;
    dot: string;
};

/**
 * How each state reads.
 *
 * `WARN` is deliberately **"Not yet"** rather than "Needs you". Almost nothing that lands there is
 * something a person failed to do — no competencies and no starter tasks both follow from the
 * corpus, and the system builds them when a crawl finishes. Labelling that as somebody's
 * outstanding task invents a chore and then blames them for it.
 */
const STATE_STYLES: Record<RungState, StateStyle> = {
    OK: {
        icon: CheckCircle2,
        chip: 'bg-app-success-bg text-app-success-text border border-app-success-border',
        label: 'Ready',
        dot: 'border-app-success-border bg-app-success-bg text-app-success-text',
    },
    WARN: {
        icon: CircleDashed,
        chip: 'bg-app-surface-hover text-app-text-muted border border-app-border',
        label: 'Not yet',
        dot: 'border-app-border bg-app-surface-hover text-app-text-muted',
    },
};

/**
 * What this project has, stage by stage: whether a corpus is connected, whether there is a
 * vocabulary to teach and measure against, whether there is work a hire could claim, and whether
 * roles say how their people are spoken to.
 *
 * ⚠️ **A readout, not a to-do list.** Connecting a repository is the only step a person performs;
 * everything below follows from a crawl, so each rung reports an outcome rather than issuing a
 * chore. States are "Ready" and "Not yet", **nothing is counted as outstanding**, and a rung links
 * to the thing itself rather than to "the page that advances it".
 */
export function SetupReadinessLadder({ ladder }: { ladder: SetupLadder }) {
    return (
        <div className="space-y-5">
            <div
                className={`rounded-2xl border p-4 ${
                    ladder.ready
                        ? 'border-app-success-border bg-app-success-bg'
                        : 'border-app-border bg-app-bg'
                }`}
            >
                {ladder.ready ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-app-success-text">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        This project has everything a hire arrives into: a corpus, a vocabulary, and
                        work they can claim.
                    </p>
                ) : (
                    // ⚠️ No count of what is outstanding. Counting stages "needing attention" turns
                    // this into a checklist, and three of the four fill themselves in from a crawl.
                    <p className="text-sm text-app-text-muted">
                        Not everything is in place yet — each stage below says what is there and
                        what is not.{' '}
                        <span className="font-medium text-app-text">
                            Nobody is blocked meanwhile
                        </span>
                        : a hire can arrive, ask their buddy and claim work at any of these states.
                    </p>
                )}
            </div>

            <ol className="space-y-3">
                {ladder.rungs.map((rung) => (
                    <RungRow key={rung.key} rung={rung} />
                ))}
            </ol>
        </div>
    );
}

function RungRow({ rung }: { rung: LadderRung }) {
    const style = STATE_STYLES[rung.state];
    const StateIcon = style.icon;

    return (
        <li className="rounded-2xl border border-app-border bg-app-bg p-4">
            <div className="flex items-start gap-4">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.dot}`}
                    aria-hidden="true"
                >
                    <StateIcon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-app-text">{rung.title}</h3>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}
                        >
                            {style.label}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-app-text">{rung.detail}</p>
                    <p className="mt-1 text-sm text-app-text-muted">{rung.blurb}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {/*
                          The link goes to the thing the rung is *about*, so a reader who wants to
                          see or correct it can. Not to "the page that advances this stage" --
                          there is no pipeline to advance.
                        */}
                        <NavLink
                            to={rung.route}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-app-brand transition-colors hover:text-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            {rung.openLabel}
                            <ArrowRight className="h-4 w-4" />
                        </NavLink>
                        {rung.reviewKind && (
                            // Not "Review proposals": these tasks are live and claimable
                            // the moment they are mined. Looking at one lifts the matcher's
                            // demotion; it does not admit it to anything.
                            <NavLink
                                to={`/setup/review?kind=${rung.reviewKind}`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                Look over what was mined
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}
