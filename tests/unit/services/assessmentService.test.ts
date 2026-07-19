import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    assessmentService,
    getLastSeenGraphVersion,
    markGraphVersionSeen
} from '../../../src/services/assessmentService';
import { http, HttpResponse } from 'msw';
import { server } from '../../unit/setup/vitest.setup';

describe('assessmentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('startAssessment posts to the start endpoint and returns the session/question', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () =>
                HttpResponse.json({ sessionId: 'session1', question: 'Walk me through a recent PR.' }),
            ),
        );

        const result = await assessmentService.startAssessment();

        expect(result).toEqual({ sessionId: 'session1', question: 'Walk me through a recent PR.' });
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

    it('fetchPath gets the competency path for the given project from the backend', async () => {
        let seenProjectId: string | null = null;
        server.use(
            http.get('/api/v1/onboarding/me/path', ({ request }) => {
                seenProjectId = new URL(request.url).searchParams.get('projectId');
                return HttpResponse.json({
                    nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
                    edges: [],
                    graphVersion: 1,
                });
            }),
        );

        const path = await assessmentService.fetchPath('proj-7');

        expect(seenProjectId).toBe('proj-7');
        expect(path.nodes).toEqual([
            { key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 },
        ]);
        expect(path.edges).toEqual([]);
        expect(path.graphVersion).toBe(1);
    });
});

describe('graph version seen tracking', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('returns null when nothing has been recorded', () => {
        expect(getLastSeenGraphVersion('user1')).toBeNull();
    });

    it('round-trips a stored version', () => {
        markGraphVersionSeen('user1', 3);

        expect(getLastSeenGraphVersion('user1')).toBe(3);
    });

    it('keeps versions separate per user', () => {
        markGraphVersionSeen('user1', 3);
        markGraphVersionSeen('user2', 7);

        expect(getLastSeenGraphVersion('user1')).toBe(3);
        expect(getLastSeenGraphVersion('user2')).toBe(7);
    });

    it('rejects a garbage stored value', () => {
        window.localStorage.setItem('competency-graph-version-seen:user1', 'not-a-number');

        expect(getLastSeenGraphVersion('user1')).toBeNull();
    });
});
