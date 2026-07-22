import { AlertTriangle, PartyPopper, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BuddyNudge, BuddyNudgeTone } from '../nudge';

const TONE_ICON: Record<BuddyNudgeTone, ReactNode> = {
    attention: <AlertTriangle className="h-4 w-4 text-app-danger-text" aria-hidden="true" />,
    positive: <PartyPopper className="h-4 w-4 text-app-brand-text" aria-hidden="true" />,
    info: <Sparkles className="h-4 w-4 text-app-brand-text" aria-hidden="true" />,
};

type BuddyNudgeCardProps = {
    nudge: BuddyNudge;
    /** Seeds the conversation with the nudge's invited question. */
    onAct: (question: string) => void;
};

/**
 * The buddy's proactive "I noticed…" note at the top of the home. Compact and dismissible-by-acting:
 * its one button turns the observation into a real question rather than leaving the hire to phrase it.
 */
export function BuddyNudgeCard({ nudge, onAct }: BuddyNudgeCardProps) {
    return (
        <div className="mx-auto flex w-full max-w-3xl items-start gap-3 rounded-xl border border-app-border bg-app-surface px-4 py-3">
            <span className="mt-0.5 shrink-0">{TONE_ICON[nudge.tone]}</span>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-app-text">{nudge.message}</p>
                {nudge.action && (
                    <button
                        type="button"
                        onClick={() => onAct(nudge.action!.question)}
                        className="mt-1.5 text-sm font-medium text-app-brand-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {nudge.action.label}
                    </button>
                )}
            </div>
        </div>
    );
}
