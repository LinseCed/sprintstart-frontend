import {
    BookOpen,
    ClipboardCheck,
    Compass,
    FileQuestion,
    Footprints,
    HelpCircle,
    Library,
    ListChecks
} from 'lucide-react';
import type { KnownModulePageKind, ModulePage } from '../types';
import { isKnownPageKind } from '../types';

type ModuleStepperProps = {
    pages: ModulePage[];
    activePageId: string | null;
    onSelect: (pageId: string) => void;
};

const PAGE_ICONS: Record<KnownModulePageKind, typeof BookOpen> = {
    CONTEXT: Compass,
    LESSON: BookOpen,
    WALKTHROUGH: Footprints,
    TASK: ListChecks,
    RESOURCE: Library,
    CHECK: HelpCircle,
    VERIFY: ClipboardCheck
};

/**
 * The module's page rail: which page you're on, and direct access to the others.
 *
 * Every page stays reachable, including jumping straight to the graded check --
 * gating is the check's job, not the navigation's; a hire who already knows the
 * material should be able to test out without scrolling past a lesson.
 *
 * Pages are addressed by id, not index, so a deep link survives a PM reordering
 * the module. With an index, a shared link silently points at different content
 * after an edit.
 */
export function ModuleStepper({ pages, activePageId, onSelect }: ModuleStepperProps) {
    return (
        <nav aria-label="Module pages">
            <ol className="flex flex-wrap items-center gap-2">
                {pages.map(page => {
                    const Icon = isKnownPageKind(page.kind) ? PAGE_ICONS[page.kind] : FileQuestion;
                    const isActive = page.id === activePageId;
                    return (
                        <li key={page.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(page.id)}
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
