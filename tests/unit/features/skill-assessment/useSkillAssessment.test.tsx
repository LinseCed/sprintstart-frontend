import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup/vitest.setup';
import { useSkillAssessment } from '../../../../src/features/skill-assessment/hooks/useSkillAssessment';

// window.localStorage is non-functional in this sandbox's Node/Vitest combination (not just
// .clear() -- .setItem()/.removeItem() throw too, matching the `--localstorage-file` warning
// printed on every run). Fake the completed-flag store in memory instead of touching real
// localStorage, so these tests actually exercise the resume-vs-restart branch.
const completedStore = new Map<string, boolean>();

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' }, status: 'authenticated' }),
}));

vi.mock('../../../../src/services/assessmentService', async () => {
    const actual = await vi.importActual<typeof import('../../../../src/services/assessmentService')>(
        '../../../../src/services/assessmentService',
    );
    return {
        ...actual,
        hasCompletedAssessment: (userId: string) => completedStore.get(userId) ?? false,
        markAssessmentCompleted: (userId: string) => completedStore.set(userId, true),
    };
});

describe('useSkillAssessment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        completedStore.clear();
    });

    it('starts a session on mount and shows the first question', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () =>
                HttpResponse.json({ sessionId: 'session1', question: 'Walk me through a recent PR.' }),
            ),
        );

        const { result } = renderHook(() => useSkillAssessment());

        await waitFor(() => {
            expect(result.current.messages).toEqual([
                { id: 'q-0', role: 'assistant', content: 'Walk me through a recent PR.' },
            ]);
        });
        expect(result.current.phase).toBe('chat');
        expect(result.current.error).toBeNull();
    });

    it('advances to the next question when the turn is not done', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () =>
                HttpResponse.json({ sessionId: 'session1', question: 'Q1' }),
            ),
            http.post('/api/v1/onboarding/me/assessment/answer', () =>
                HttpResponse.json({ done: false, question: 'Q2' }),
            ),
        );

        const { result } = renderHook(() => useSkillAssessment());
        await waitFor(() => expect(result.current.messages).toHaveLength(1));

        act(() => {
            result.current.submitAnswer('my answer');
        });

        await waitFor(() => {
            expect(result.current.messages.map(m => m.content)).toEqual(['Q1', 'my answer', 'Q2']);
        });
        expect(result.current.phase).toBe('chat');
    });

    it('transitions to the path phase, loads the path, and records completion when the turn is done', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () =>
                HttpResponse.json({ sessionId: 'session1', question: 'Q1' }),
            ),
            http.post('/api/v1/onboarding/me/assessment/answer', () =>
                HttpResponse.json({ done: true }),
            ),
            http.get('/api/v1/onboarding/me/path', () =>
                HttpResponse.json({
                    nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
                    edges: [],
                    graphVersion: 1,
                }),
            ),
        );

        const { result } = renderHook(() => useSkillAssessment());
        await waitFor(() => expect(result.current.messages).toHaveLength(1));

        act(() => {
            result.current.submitAnswer('final answer');
        });

        await waitFor(() => {
            expect(result.current.phase).toBe('path');
        });
        expect(result.current.path?.nodes.length).toBeGreaterThan(0);
        expect(completedStore.get('user1')).toBe(true);
    });

    it('skips the interview and loads the path directly when already completed', async () => {
        completedStore.set('user1', true);
        let startCalled = false;
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () => {
                startCalled = true;
                return HttpResponse.json({ sessionId: 'session1', question: 'Q1' });
            }),
            http.get('/api/v1/onboarding/me/path', () =>
                HttpResponse.json({
                    nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
                    edges: [],
                    graphVersion: 1,
                }),
            ),
        );

        const { result } = renderHook(() => useSkillAssessment());

        await waitFor(() => {
            expect(result.current.phase).toBe('path');
        });
        expect(startCalled).toBe(false);
        expect(result.current.messages).toEqual([]);
    });

    it('sets an error when starting fails, and retry re-attempts it', async () => {
        let attempts = 0;
        server.use(
            http.post('/api/v1/onboarding/me/assessment/start', () => {
                attempts += 1;
                if (attempts === 1) {
                    return new HttpResponse(null, { status: 503 });
                }
                return HttpResponse.json({ sessionId: 'session1', question: 'Q1' });
            }),
        );

        const { result } = renderHook(() => useSkillAssessment());

        await waitFor(() => {
            expect(result.current.error).not.toBeNull();
        });

        act(() => {
            result.current.retry();
        });

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.messages).toEqual([{ id: 'q-0', role: 'assistant', content: 'Q1' }]);
        });
    });
});
