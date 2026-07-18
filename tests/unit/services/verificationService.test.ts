import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup/vitest.setup';
import { verificationService } from '../../../src/services/verificationService';
import { ApiError } from '../../../src/services/apiClient';

describe('verificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchVerification gets the config for a step', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/steps/step1/verification', () =>
                HttpResponse.json({
                    id: 'v1',
                    stepId: 'step1',
                    type: 'KNOWLEDGE',
                    prompt: 'Why?',
                    competencyKey: 'kotlin',
                    level: 'beginner'
                })
            )
        );

        const result = await verificationService.fetchVerification('step1');

        expect(result).toEqual({
            id: 'v1',
            stepId: 'step1',
            type: 'KNOWLEDGE',
            prompt: 'Why?',
            competencyKey: 'kotlin',
            level: 'beginner'
        });
    });

    it('submitVerificationAttempt posts the answer and returns the graded result', async () => {
        let capturedBody: unknown;
        server.use(
            http.post('/api/v1/onboarding/me/steps/step1/verification/attempts', async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({
                    attemptId: 'a1',
                    stepId: 'step1',
                    passed: true,
                    score: 1,
                    feedback: 'Matches exactly.',
                    hint: null,
                    attemptNo: 1,
                    graphVersion: 3,
                    stepStatus: 'FINISHED'
                });
            })
        );

        const result = await verificationService.submitVerificationAttempt('step1', 'chroma');

        expect(capturedBody).toEqual({ answer: 'chroma' });
        expect(result.passed).toBe(true);
        expect(result.stepStatus).toBe('FINISHED');
    });

    it('propagates a 503 as an ApiError when grading is unavailable', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/steps/step1/verification/attempts', () =>
                new HttpResponse('Grading is temporarily unavailable', { status: 503 })
            )
        );

        await expect(verificationService.submitVerificationAttempt('step1', 'x')).rejects.toSatisfy(
            (error: unknown) => error instanceof ApiError && error.status === 503
        );
    });
});
