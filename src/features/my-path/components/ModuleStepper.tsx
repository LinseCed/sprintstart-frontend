import { BookOpen, ClipboardCheck, ListChecks } from 'lucide-react';
import type { StepPage, StepPageKind } from '../types';

type ModuleStepperProps = {
    pages: StepPage[];
    activeIndex: number;
    /** Index of the furthest page reached, so skipping ahead stays bounded. */
    onSelect: (index: number) => void;
};

const PAGE_ICONS: Record<StepPageKind, typeof BookOpen> = {
    LESSON: BookOpen,
    TASK: ListChecks,
    VERIFY: ClipboardCheck
};

/**
 * The module's page rail: which page you're on, and direct access to the others.
 *
 * Every page stays reachable (including jumping straight to the check) --
 * gating is the verification's job, not the navigation's; a hire who already
 * knows the material should be able to test out without scrolling past a lesson.
 */
export function ModuleStepper({ pages, activeIndex, onSelect }: ModuleStepperProps) {
    return (
        <nav aria-label="Module pages">
            <ol className="flex flex-wrap items-center gap-2">
                {pages.map((page, index) => {
                    const Icon = PAGE_ICONS[page.kind];
                    const isActive = index === activeIndex;
                    return (
                        <li key={`${page.kind}-${index}`}>
                            <button
                                type="button"
                                onClick={() => onSelect(index)}
                                aria-current={isActive ? 'step' : undefined}
                                className={[
                                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus',
                                    isActive
                                        ? 'border-app-brand-border-strong bg-app-brand text-white'
                                        : 'border-app-border bg-app-surface text-app-text-muted hover:bg-app-surface-hover hover:text-app-text'
                                ].join(' ')}
                            >
                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {page.title}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
