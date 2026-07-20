import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../services/apiClient';
import { competencyModuleService } from '../../../services/competencyModuleService';
import type { VerificationAttemptResult, VerificationEndpoint } from '../../learn-verify/types';
import type { CompetencyModule } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Loads the shared module behind a path node and drives its check.
 *
 * The module and its check are fetched separately because a module without a
 * configured check is a real state, not an error -- pages can be published while
 * the gate is still being written, and the hire should read them rather than see
 * a failure.
 *
 * A `KNOWLEDGE`/`ARTIFACT` grading call can 503 when the AI service is
 * unavailable; the backend surfaces that rather than fabricating a grade, so it
 * is tracked separately from a generic submit failure.
 */
export function useCompetencyModule(moduleId: string | null) {
    const [module, setModule] = useState<CompetencyModule | null>(null);
    const [verification, setVerification] = useState<VerificationEndpoint | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [answer, setAnswer] = useState('');
    const [attempts, setAttempts] = useState<VerificationAttemptResult[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [gradingUnavailable, setGradingUnavailable] = useState(false);

    useEffect(() => {
        if (!moduleId) return;

        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const loaded = await competencyModuleService.fetchModule(moduleId);
                if (cancelled) return;
                setModule(loaded);
            } catch (err) {
                if (cancelled) return;
                setLoadError(toMessage(err, 'Could not load this module.'));
                setIsLoading(false);
                return;
            }

            try {
                const check = await competencyModuleService.fetchVerification(moduleId);
                if (!cancelled) setVerification(check);
            } catch {
                // No check configured yet: the pages are still worth reading.
                if (!cancelled) setVerification(null);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void load();

        return () => {
            cancelled = true;
        };
    }, [moduleId]);

    const submit = useCallback(async () => {
        if (!moduleId || !answer.trim()) return;

        setSubmitting(true);
        setSubmitError(null);
        setGradingUnavailable(false);
        try {
            const result = await competencyModuleService.submitAttempt(moduleId, answer.trim());
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
    }, [moduleId, answer]);

    const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    return {
        module,
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
