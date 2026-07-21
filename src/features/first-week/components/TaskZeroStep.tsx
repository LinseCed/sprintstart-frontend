import { ExternalLink, GitBranch, GitMerge, GitPullRequest, Lock, MessagesSquare, PartyPopper, Sparkles } from 'lucide-react';
import { StepShell } from './EnvironmentStep';
import type { MyTaskZero } from '../types';

type TaskZeroStepProps = {
    taskZero: MyTaskZero | null;
    environmentReady: boolean;
    onHandBack: () => void;
    isHandingBack: boolean;
};

const PR_LOOP: { icon: typeof GitBranch; label: string; detail: string }[] = [
    { icon: GitBranch, label: 'Branch', detail: 'Make a branch off the default one — never commit straight to it.' },
    { icon: GitPullRequest, label: 'Open a pull request', detail: 'Push your change and open a PR. Small is good here.' },
    { icon: MessagesSquare, label: 'Get a review', detail: 'A reviewer reads it and may ask for changes — that is the point, not a setback.' },
    { icon: GitMerge, label: 'Merge', detail: 'Once approved, it merges. Your name is now in the history.' }
];

/**
 * Step 2 of the first week: your first task.
 *
 * Task 0 appears only once the environment is ready — before that it is a quiet
 * locked state, never a screen that gates the hire out. When assigned, the
 * branch → PR → review → merge loop is spelled out for someone who has never
 * contributed here, because the task is the easy part; the loop is what is new.
 */
export function TaskZeroStep({ taskZero, environmentReady, onHandBack, isHandingBack }: TaskZeroStepProps) {
    if (!environmentReady) {
        return (
            <StepShell index={2} title="Your first task">
                <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface-muted p-4">
                    <Lock className="h-4 w-4 shrink-0 text-app-text-muted" aria-hidden="true" />
                    <p className="text-sm text-app-text-muted">
                        Appears once your environment is ready. There is nothing to do here yet — no rush.
                    </p>
                </div>
            </StepShell>
        );
    }

    if (taskZero?.noneAvailable || !taskZero?.task) {
        return (
            <StepShell index={2} title="Your first task">
                <div className="flex items-start gap-3 rounded-xl border border-app-border bg-app-surface-muted p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-app-brand" aria-hidden="true" />
                    <p className="text-sm text-app-text-muted">
                        Your environment is ready — nice. Your PM is lining up a first task for you; it
                        will show up here. In the meantime, say hello to your buddy below.
                    </p>
                </div>
            </StepShell>
        );
    }

    const task = taskZero.task;

    return (
        <StepShell index={2} title="Your first task">
            {taskZero.loopProven && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-app-success-border bg-app-success-bg/40 px-3 py-2">
                    <PartyPopper className="h-4 w-4 shrink-0 text-app-success-solid" aria-hidden="true" />
                    <p className="text-xs font-medium text-app-text">
                        You&apos;ve merged a pull request — the loop is proven. This is the whole game.
                    </p>
                </div>
            )}

            <div className="rounded-xl border border-app-border bg-app-bg p-4">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-app-text">{task.title}</p>
                    {task.sourceUrl && (
                        <a
                            href={task.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                    )}
                </div>
                {task.summary && <p className="mt-1 text-xs text-app-text-muted">{task.summary}</p>}
                <p className="mt-2 text-xs text-app-text-subtle">
                    It&apos;s deliberately small. Finishing it proves the loop works — it doesn&apos;t
                    count toward any competency, and it isn&apos;t a test.
                </p>
            </div>

            <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    How a change ships here
                </p>
                <ol className="space-y-2">
                    {PR_LOOP.map((step, i) => (
                        <li key={step.label} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-brand-soft text-[11px] font-semibold text-app-brand-text">
                                {i + 1}
                            </span>
                            <div>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-app-text">
                                    <step.icon className="h-3.5 w-3.5 text-app-text-muted" aria-hidden="true" />
                                    {step.label}
                                </span>
                                <p className="text-xs text-app-text-muted">{step.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <button
                type="button"
                onClick={onHandBack}
                disabled={isHandingBack}
                className="mt-4 text-xs font-medium text-app-text-muted underline-offset-2 transition-colors hover:text-app-text hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
            >
                {isHandingBack ? 'Handing it back…' : 'Not a fit? Hand it back'}
            </button>
        </StepShell>
    );
}
