import { apiClient } from './apiClient';
import type {
    AssessmentAnswerResponse,
    AssessmentStartResponse,
    AssessmentStatusResponse
} from '../features/skill-assessment/types';

export const assessmentService = {
    /**
     * Whether the authenticated user has ever completed a placement interview.
     * Drives the buddy's intake mode: no completed placement means the buddy
     * opens with the interview; completed means it opens as the mentor. A hint,
     * not a door — the assessment never gates anything.
     */
    async fetchAssessmentStatus(): Promise<AssessmentStatusResponse> {
        return await apiClient.fetch<AssessmentStatusResponse>(
            '/api/v1/onboarding/me/assessment/status'
        );
    },

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
    }
};
