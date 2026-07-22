import { Check, LifeBuoy } from 'lucide-react';
import { openAiBuddy } from '../../buddy/aiBuddyBus';

/**
 * Step 1 of the first week: get it running.
 *
 * There is no synthesised command and no readiness check — every stack builds
 * differently, and the product can't (and shouldn't pretend to) detect a local
 * build. So this step points at the repo's own setup and makes the real unblock —
 * the buddy — one action away: it knows this codebase and escalates to a person
 * (your PM) when it can't answer. It gates nothing: the first task below is
 * available whether or not the environment is up.
 */
export function EnvironmentStep() {
    return (
        <StepShell index={1} title="Get it running">
            <p className="mb-3 text-sm text-app-text-muted">
                Clone the project and get it building and running the way its README describes. Every
                stack is different, so there&apos;s no one command here — follow the repo&apos;s own
                setup steps.
            </p>
            <p className="mb-4 text-xs text-app-text-muted">
                Setup is the thing most people get stuck on first, and that&apos;s normal — you
                don&apos;t need to finish it before starting your first task below. The moment it
                fights you, ask your buddy — it knows this codebase, and it&apos;ll flag your PM if
                it can&apos;t answer.
            </p>

            {/* Buddy-first: the AI buddy is the instant, always-on unblock — and it escalates to a
                person (your PM) itself when it can't help, so a hire is never left to go chase a
                colleague on their own. */}
            <button
                type="button"
                onClick={() =>
                    openAiBuddy({
                        draft: "I'm stuck getting the project running. Here's what I tried and the error I hit: "
                    })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
            >
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                Stuck? Ask your buddy
            </button>
        </StepShell>
    );
}

/** Shared numbered-step frame so the three first-week steps read as one sequence. */
export function StepShell({
    index,
    title,
    done = false,
    children
}: {
    index: number;
    title: string;
    done?: boolean;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-app-border bg-app-surface p-5">
            <div className="mb-3 flex items-center gap-2.5">
                <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        done
                            ? 'bg-app-success-solid text-white'
                            : 'bg-app-brand-soft text-app-brand-text'
                    }`}
                >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index}
                </span>
                <h2 className="text-base font-semibold text-app-text">{title}</h2>
            </div>
            {children}
        </section>
    );
}
