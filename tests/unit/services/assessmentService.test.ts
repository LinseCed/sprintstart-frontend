import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assessmentService } from '../../../src/services/assessmentService';
import { http, HttpResponse } from 'msw';
import { server } from '../../unit/setup/vitest.setup';

describe('assessmentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchAssessmentStatus reads whether the caller has a completed placement for the project', async () => {
        let capturedUrl: URL | undefined;
        server.use(
            http.get('/api/v1/onboarding/me/assessment/status', ({ request }) => {
                capturedUrl = new URL(request.url);
                return HttpResponse.json({ completed: true });
            }),
        );

        const result = await assessmentService.fetchAssessmentStatus('project1');

        expect(result).toEqual({ completed: true });
        expect(capturedUrl?.searchParams.get('projectId')).toBe('project1');
    });

    it('startAssessment posts to the start endpoint scoped to the project and returns the session/question', async () => {
        let capturedUrl: URL | undefined;
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', ({ request }) => {
                capturedUrl = new URL(request.url);
                return HttpResponse.json({ sessionId: 'session1', question: 'Walk me through a recent PR.' });
            }),
        );

        const result = await assessmentService.startAssessment('project1');

        expect(result).toEqual({ sessionId: 'session1', question: 'Walk me through a recent PR.' });
        expect(capturedUrl?.searchParams.get('projectId')).toBe('project1');
    });

    it('startAssessment returns done:true with no question when the project has nothing to assess', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () =>
                HttpResponse.json({ sessionId: 'session1', question: null, done: true }),
            ),
        );

        const result = await assessmentService.startAssessment('project1');

        expect(result).toEqual({ sessionId: 'session1', question: null, done: true });
    });

    it('answerAssessment posts the session id and answer, returning the next question', async () => {
        let capturedBody: unknown;
        server.use(
            http.post('/api/v1/onboarding/me/assessment/answer', async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({ done: false, question: 'What would you do differently?' });
            }),
        );

        const result = await assessmentService.answerAssessment('session1', 'It fixed a bug.');

        expect(capturedBody).toEqual({ sessionId: 'session1', answer: 'It fixed a bug.' });
        expect(result).toEqual({ done: false, question: 'What would you do differently?' });
    });

    it('answerAssessment returns done:true with no question when finished', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/answer', () =>
                HttpResponse.json({ done: true, question: null }),
            ),
        );

        const result = await assessmentService.answerAssessment('session1', 'final answer');

        expect(result).toEqual({ done: true, question: null });
    });
});
