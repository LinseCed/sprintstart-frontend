import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, ChevronDown, Flag, Loader2 } from 'lucide-react';
import { SourceLinks } from './SourceLinks';
import { STEP_LABELS } from '../steps';
import type { OrientationSection } from '../types';

type OrientationSectionCardProps = {
    section: OrientationSection;
    isOpen: boolean;
    onToggle: () => void;
    onReport: (section: OrientationSection) => Promise<void>;
};

/**
 * One step of the packet, collapsible, with its sources shown under it.
 *
 * Collapsed by default once a hire has been here before (see `useOpenSteps`) —
 * the value of step segmentation is precisely that you can skip the parts you
 * have done.
 */
export function OrientationSectionCard({
    section,
    isOpen,
    onToggle,
    onReport
}: OrientationSectionCardProps) {
    const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const label = STEP_LABELS[section.step] ?? section.step;

    const handleReport = async () => {
        setReportState('sending');
        try {
            await onReport(section);
            setReportState('sent');
        } catch {
            // Reporting is a courtesy the hire is doing us. If it fails, let them
            // try again rather than showing an error they cannot act on.
            setReportState('idle');
        }
    };

    return (
        <li className="overflow-hidden rounded-xl border border-app-border bg-app-bg">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-app-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
            >
                <span>
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-app-text-subtle">
                        {label}
                    </span>
                    <span className="block text-sm font-medium text-app-text">{section.title}</span>
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-app-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="border-t border-app-border px-4 py-3">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
                    </div>

                    <SourceLinks label="Where this came from" items={section.citations} />

                    <button
                        type="button"
                        onClick={() => void handleReport()}
                        disabled={reportState !== 'idle'}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-app-text-muted underline-offset-2 transition-colors hover:text-app-text hover:underline disabled:no-underline disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {reportState === 'sending' && (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        )}
                        {reportState === 'sent' && (
                            <Check className="h-3 w-3 text-app-success-solid" aria-hidden="true" />
                        )}
                        {reportState === 'idle' && <Flag className="h-3 w-3" aria-hidden="true" />}
                        {reportState === 'sent'
                            ? 'Thanks — passed on'
                            : 'This is wrong or out of date'}
                    </button>
                </div>
            )}
        </li>
    );
}
