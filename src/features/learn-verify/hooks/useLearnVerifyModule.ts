import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../services/apiClient';
import { onboardingService } from '../../../services/onboardingService';
import { verificationService } from '../../../services/verificationService';
import type { OnboardingStepDetail } from '../../onboarding/types';
import type { VerificationAttemptResult, VerificationEndpoint } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Loads a node's step content + verification config and drives the submit/retry
 * loop. Attempts accumulate locally for the session (the backend has no
 * attempt-history endpoint for this feature) so the Verify zone can show a
 * running attempt count and the latest hint.
 *
 * A `KNOWLEDGE` grading call can 503 when the AI service is unavailable -- the
 * backend deliberately surfaces this as a retryable error rather than a
 * fabricated grade, so it's tracked separately (`gradingUnavailable`) from a
 * generic submit failure.
 */
export function useLearnVerifyModule(stepId: string | null) {
    const [step, setStep] = useState<OnboardingStepDetail | null>(null);
    const [verification, setVerification] = useState<VerificationEndpoint | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [answer, setAnswer] = useState('');
    const [attempts, setAttempts] = useState<VerificationAttemptResult[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [gradingUnavailable, setGradingUnavailable] = useState(false);

    useEffect(() => {
        if (!stepId) return;

        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const [stepResult, verificationResult] = await Promise.all([
                    onboardingService.fetchStep(stepId),
                    verificationService.fetchVerification(stepId)
                ]);
                if (cancelled) return;
                setStep(stepResult);
                setVerification(verificationResult);
            } catch (err) {
                if (cancelled) return;
                setLoadError(toMessage(err, 'Could not load this node.'));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void load();

        return () => {
            cancelled = true;
        };
    }, [stepId]);

    const submit = useCallback(async () => {
        if (!stepId || !answer.trim()) return;

        setSubmitting(true);
        setSubmitError(null);
        setGradingUnavailable(false);
        try {
            const result = await verificationService.submitVerificationAttempt(stepId, answer.trim());
            setAttempts(previous => [...previous, result]);
            setAnswer('');
        } catch (err) {
            if (err instanceof ApiError && err.status === 503) {
                setGradingUnavailable(true);
            } else {
                setSubmitError(toMessage(err, 'Could not submit your answer.'));
            }
        } finally {
            setSubmitting(false);
        }
    }, [stepId, answer]);

    const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    return {
        step,
        verification,
        isLoading,
        loadError,
        answer,
        setAnswer,
        attempts,
        latestAttempt,
        passed: latestAttempt?.passed ?? false,
        submitting,
        submitError,
        gradingUnavailable,
        submit
    };
}
