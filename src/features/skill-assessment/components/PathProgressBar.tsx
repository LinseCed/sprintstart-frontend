import { useReducedMotion } from 'framer-motion';
import type { PathView } from '../types';

type PathProgressBarProps = {
    path: PathView;
    className?: string;
};

/**
 * Overall mastered/total fill, the "graph-fill" summary for the whole path -- same
 * gradient-fill treatment as `MemberOnboardingSection`'s per-hire progress bar, animated
 * unless the user prefers reduced motion.
 */
export function PathProgressBar({ path, className = '' }: PathProgressBarProps) {
    const reduceMotion = useReducedMotion();
    const total = path.nodes.length;
    if (total === 0) return null;

    const mastered = path.nodes.filter(node => node.state === 'mastered').length;
    const percentage = Math.round((mastered / total) * 100);

    return (
        <div className={className}>
            <div className="mb-1.5 flex items-center justify-between text-xs text-app-text-muted">
                <span>Your progress</span>
                <span>
                    {mastered} / {total} mastered
                </span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Competency path progress"
                className="h-2 overflow-hidden rounded-full bg-app-border-muted"
            >
                <div
                    className={`h-full rounded-full bg-gradient-to-r from-app-brand to-app-progress-fill-end ${
                        reduceMotion ? '' : 'transition-[width] duration-700 ease-out'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
