import { useState } from 'react';
import { Check, CircleCheck, Copy, LifeBuoy, RefreshCw, Terminal } from 'lucide-react';
import { openAiBuddy } from '../../buddy/aiBuddyBus';
import type { MyEnvironment } from '../types';

type EnvironmentStepProps = {
    environment: MyEnvironment | null;
    onRefresh: () => void;
    isRefreshing: boolean;
};

// The documented one-liner is a per-project convention (a repo script that runs build + tests and
// posts the result to POST /me/environment/report as the hire). It isn't modelled in any contract,
// so this is the representative command the setup docs describe — readiness still arrives from the
// backend, never from a button here.
const SETUP_COMMAND = './scripts/onboard-check.sh';

function evidenceLine(environment: MyEnvironment): string {
    if (environment.derived) return 'We saw a pull request you authored — so your environment clearly works.';
    if (environment.evidence === 'GREEN_CI') return 'A green CI run on your branch settled it.';
    if (environment.evidence === 'BUILD_TEST_RUN') return 'Your build-and-test run reported success.';
    return 'Your environment is up.';
}

/**
 * Step 1 of the first week: can you run it?
 *
 * Shows the exact command and what a good result looks like. Readiness is never
 * self-declared — it arrives on its own when the check posts its result — so
 * there is no "mark ready" control, only a way to re-check. A hire who cannot get
 * it working reaches a person in one action, because this is the moment the human
 * loop matters most.
 */
export function EnvironmentStep({ environment, onRefresh, isRefreshing }: EnvironmentStepProps) {
    const [copied, setCopied] = useState(false);

    const copyCommand = async () => {
        try {
            await navigator.clipboard.writeText(SETUP_COMMAND);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be unavailable (permissions, insecure context); the command is visible
            // to copy by hand, so this is not worth surfacing as an error.
        }
    };

    if (environment?.ready) {
        return (
            <StepShell index={1} title="Can you run it?" done>
                <div className="flex items-start gap-3 rounded-xl border border-app-success-border bg-app-success-bg/40 p-4">
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-app-success-solid" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-app-text">Your environment is ready.</p>
                        <p className="mt-0.5 text-xs text-app-text-muted">{evidenceLine(environment)}</p>
                    </div>
                </div>
            </StepShell>
        );
    }

    return (
        <StepShell index={1} title="Can you run it?">
            <p className="mb-3 text-sm text-app-text-muted">
                Get the project building and its tests passing on your machine. Run this in your
                checkout — it posts the result for you, so this page updates on its own when it works.
            </p>

            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-app-border bg-app-surface-muted px-3 py-2">
                <code className="flex items-center gap-2 truncate font-mono text-sm text-app-text">
                    <Terminal className="h-4 w-4 shrink-0 text-app-text-muted" aria-hidden="true" />
                    {SETUP_COMMAND}
                </code>
                <button
                    type="button"
                    onClick={() => void copyCommand()}
                    aria-label="Copy command"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <p className="mb-4 text-xs text-app-text-muted">
                <span className="font-medium text-app-text">A good result:</span> the build finishes and
                every test passes — no red. When it does, readiness lands here automatically.
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-3.5 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Check again
                </button>

                {/* Stuck is exactly when the human loop matters most — one action to start reaching a
                    person, with the AI helping word the question. */}
                <button
                    type="button"
                    onClick={() =>
                        openAiBuddy({
                            draft: "I'm stuck getting the project environment running. Here's what I tried and the error I hit: "
                        })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                    Can&apos;t get it working? Ask for help
                </button>
            </div>
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
