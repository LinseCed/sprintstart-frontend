import { apiClient } from './apiClient';
import type { VerificationAttemptResult, VerificationEndpoint } from '../features/learn-verify/types';

export const verificationService = {
    /**
     * Loads the verification config for a step in the authenticated user's path.
     * Never reveals the rubric or canonical answer -- grading happens server-side.
     */
    async fetchVerification(stepId: string): Promise<VerificationEndpoint> {
        return await apiClient.fetch<VerificationEndpoint>(`/api/v1/onboarding/me/steps/${stepId}/verification`);
    },

    /**
     * Submits an answer for a step's verification and returns the graded result.
     * Works whether or not the step's lesson was ever started (test-out). On pass,
     * the backend finishes the step and updates the competency ledger.
     */
    async submitVerificationAttempt(stepId: string, answer: string): Promise<VerificationAttemptResult> {
        return await apiClient.fetch<VerificationAttemptResult>(
            `/api/v1/onboarding/me/steps/${stepId}/verification/attempts`,
            {
                method: 'POST',
                body: JSON.stringify({ answer })
            }
        );
    }
};
