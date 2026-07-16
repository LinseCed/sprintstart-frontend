import { apiClient } from './apiClient';
import type {
    AssessmentAnswerResponse,
    AssessmentStartResponse,
    PathView
} from '../features/skill-assessment/types';

export const assessmentService = {
    /**
     * Starts the authenticated user's skill-assessment interview, or resumes it
     * if one is already in progress.
     */
    async startAssessment(): Promise<AssessmentStartResponse> {
        return await apiClient.fetch<AssessmentStartResponse>(
            '/api/v1/onboarding/me/assessment/start',
            { method: 'POST' }
        );
    },

    /**
     * Submits the candidate's answer for the open turn of a session.
     *
     * @returns The next question, or `done: true` once the AI interviewer has
     * returned a final placement.
     */
    async answerAssessment(
        sessionId: string,
        answer: string
    ): Promise<AssessmentAnswerResponse> {
        return await apiClient.fetch<AssessmentAnswerResponse>(
            '/api/v1/onboarding/me/assessment/answer',
            {
                method: 'POST',
                body: JSON.stringify({ sessionId, answer })
            }
        );
    },

    /**
     * Returns the authenticated user's personalized competency path: nodes
     * (mastered/available/locked) and their prerequisite/related edges,
     * projected from the competency graph and the user's progress ledger.
     */
    async fetchPath(): Promise<PathView> {
        return await apiClient.fetch<PathView>('/api/v1/onboarding/me/path');
    }
};

const graphVersionSeenPrefix = 'competency-graph-version-seen';

function getGraphVersionSeenKey(userId: string) {
    return `${graphVersionSeenPrefix}:${userId}`;
}

/**
 * Returns the competency graph version this user last saw their path at, or
 * `null` if they've never had one recorded (or the stored value is garbage).
 */
export function getLastSeenGraphVersion(userId: string): number | null {
    if (typeof window === 'undefined') return null;

    const value = window.localStorage.getItem(getGraphVersionSeenKey(userId));
    const parsed = value === null ? NaN : Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Records the competency graph version this user has now seen their path at.
 */
export function markGraphVersionSeen(userId: string, version: number): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(getGraphVersionSeenKey(userId), String(version));
}
