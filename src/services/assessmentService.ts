import { apiClient } from './apiClient';
import type {
    AssessmentAnswerResponse,
    AssessmentStartResponse,
    PathView
} from '../features/skill-assessment/types';

import pathViewMock from '../mocks/pathViewMock.json';

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
     * Returns the authenticated user's personalized competency path.
     *
     * GET /me/path is still the pre-rework endpoint today (it returns the
     * legacy phases/steps shape, not this graph {nodes,edges} contract) --
     * calling it here would silently succeed with the wrong shape rather than
     * 404, so the usual fetch-with-mock-fallback pattern (see
     * knowledgeGapService) isn't safe. This returns fixture data unconditionally
     * until the backend ships the new graph endpoint; swap the body for a real
     * `apiClient.fetch<PathView>('/api/v1/onboarding/me/path')` call then.
     */
    async fetchPath(): Promise<PathView> {
        return await Promise.resolve(pathViewMock as PathView);
    }
};
