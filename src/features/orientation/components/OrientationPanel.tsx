import { AlertCircle, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { OrientationSectionCard } from './OrientationSectionCard';
import { SourceLinks } from './SourceLinks';
import { useOpenSteps } from '../hooks/useOpenSteps';
import { orientationService } from '../../../services/orientationService';
import type { MyOrientation, OrientationPacket, OrientationSection } from '../types';

type OrientationPanelProps = {
    orientation: MyOrientation | null;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
};

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <section className="mt-4 rounded-xl border border-app-border bg-app-surface-muted p-4">
            <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-app-text-muted" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-app-text">What the team already wrote about this</h3>
            </div>
            {children}
        </section>
    );
}

function Packet({ packet }: { packet: OrientationPacket }) {
    const { isOpen, toggle } = useOpenSteps(packet.taskId, packet.sections[0]?.step);

    const report = async (section: OrientationSection) => {
        const sources = section.citations.map((c) => c.filename).join(', ');
        await orientationService.reportStaleOrientation(
            `Orientation for "${packet.taskTitle}" — the "${section.title}" section ` +
                `(${section.step}) is wrong or out of date. It was assembled from: ${sources}.`
        );
    };

    return (
        <>
            {packet.summary && <p className="mb-3 text-xs text-app-text-muted">{packet.summary}</p>}
            <ul className="space-y-2">
                {packet.sections.map((section) => (
                    <OrientationSectionCard
                        key={`${section.step}-${section.title}`}
                        section={section}
                        isOpen={isOpen(section.step)}
                        onToggle={() => toggle(section.step)}
                        onReport={report}
                    />
                ))}
            </ul>
            <SourceLinks label="Assembled from" items={packet.sources} />
            <p className="mt-2 text-[11px] text-app-text-subtle">
                Gathered from what the team has already written — nothing here was written for you,
                and it is not something you have to finish. Reading it is optional.
            </p>
        </>
    );
}

/**
 * Orientation shown beside the task it belongs to.
 *
 * Three honest states, and no fourth: the packet, an explicit "we could not put
 * this together" that still links the task, and a load failure with a retry.
 * **Nothing is ever invented to fill the gap** — a hire following fabricated
 * setup instructions on a task they will be reviewed on loses more time than
 * having no instructions at all.
 */
export function OrientationPanel({ orientation, isLoading, error, onRetry }: OrientationPanelProps) {
    if (isLoading) {
        return (
            <Shell>
                <div className="flex items-center gap-2 text-xs text-app-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Gathering what already exists…
                </div>
            </Shell>
        );
    }

    if (error) {
        return (
            <Shell>
                <div className="flex items-start gap-2 text-xs text-app-danger-text">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-1.5 inline-flex items-center gap-1 font-medium text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <RefreshCw className="h-3 w-3" aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                </div>
            </Shell>
        );
    }

    // No current task is the first-week page's business, not this panel's.
    if (!orientation?.taskId) return null;

    if (!orientation.packet) {
        return (
            <Shell>
                <p className="text-xs text-app-text-muted">
                    Nothing in this project&apos;s docs matched this task closely enough to be worth
                    handing you, so there is no guide here.{' '}
                    {orientation.reason ? `(${orientation.reason}.)` : ''} That is a gap in the
                    documentation, not something you did — open the task itself and ask your buddy
                    below.
                </p>
                {orientation.taskUrl && (
                    <SourceLinks
                        label="Start from"
                        items={[
                            {
                                filename: orientation.taskTitle ?? 'The task',
                                sourceUrl: orientation.taskUrl,
                                artifactType: 'ISSUE'
                            }
                        ]}
                    />
                )}
            </Shell>
        );
    }

    return (
        <Shell>
            <Packet packet={orientation.packet} />
        </Shell>
    );
}
