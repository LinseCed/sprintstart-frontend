import type { OnboardingStepDetail } from '../onboarding/types';
import type { VerificationEndpoint } from '../learn-verify/types';
import type { StepPage } from './types';

/**
 * The ordered pages of a module.
 *
 * The backend derives and returns `pages` (Learn -> Practice -> Verify), and
 * that is the contract. The local fallback exists for steps stored before that
 * field shipped -- they'd otherwise render an empty module -- and mirrors the
 * backend's own derivation, so the two stay interchangeable.
 */
export function resolveModulePages(
    step: OnboardingStepDetail,
    verification: VerificationEndpoint | null
): StepPage[] {
    if (step.pages && step.pages.length > 0) {
        return step.pages;
    }

    const pages: StepPage[] = [];
    if (step.content) {
        pages.push({ kind: 'LESSON', title: 'Learn', content: step.content });
    }
    if (step.tasks.length > 0) {
        pages.push({ kind: 'TASK', title: 'Practice', content: null });
    }
    if (verification) {
        pages.push({ kind: 'VERIFY', title: 'Verify', content: null });
    }
    return pages;
}
