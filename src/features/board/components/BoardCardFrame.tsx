import type { ReactNode } from 'react';
import { Bot } from 'lucide-react';
import type { BoardCardOwner } from '../types';

type BoardCardFrameProps = {
    title: string;
    owner: BoardCardOwner;
    /** Optional one-line note under the title, e.g. what the card is counting. */
    subtitle?: string;
    children: ReactNode;
};

/**
 * The shell every card renders inside: title, attribution, body.
 *
 * Attribution is on the card rather than in a legend because a hire should never have to work out
 * whether they put something here. It deliberately does **not** say "Buddy added this" yet — in
 * this slice nothing is buddy-placed, and claiming otherwise would be the board's first lie.
 */
export function BoardCardFrame({ title, owner, subtitle, children }: BoardCardFrameProps) {
    return (
        <section className="flex flex-col rounded-2xl border border-app-border bg-app-surface p-4">
            <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-app-text">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-xs text-app-text-muted">{subtitle}</p>}
                </div>
                {owner === 'AI' && (
                    <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-brand/10 px-2 py-0.5 text-[11px] font-medium text-app-brand-text"
                        title="Kept up to date for you — this card reads your onboarding live"
                    >
                        <Bot className="h-3 w-3" aria-hidden="true" />
                        Kept for you
                    </span>
                )}
            </header>
            {children}
        </section>
    );
}
