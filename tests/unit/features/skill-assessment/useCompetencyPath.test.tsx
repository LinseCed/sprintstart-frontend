import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup/vitest.setup';
import { useCompetencyPath } from '../../../../src/features/skill-assessment/hooks/useCompetencyPath';

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' } }),
}));

function pathResponse(graphVersion: number, kotlinState: 'AVAILABLE' | 'MASTERED' = 'MASTERED') {
    return {
        nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: kotlinState, level: 3 }],
        edges: [],
        graphVersion,
    };
}

describe('useCompetencyPath', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    it('loads the path on mount', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/path', () => HttpResponse.json(pathResponse(1))),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.path?.graphVersion).toBe(1);
        expect(result.current.error).toBeNull();
    });

    it('does not flag an update on a first-ever visit', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/path', () => HttpResponse.json(pathResponse(1))),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.pathUpdated).toBe(false);
    });

    it('flags an update when the stored version differs from the fetched one', async () => {
        window.localStorage.setItem('competency-graph-version-seen:user1', '1');
        server.use(
            http.get('/api/v1/onboarding/me/path', () => HttpResponse.json(pathResponse(2))),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));

        await waitFor(() => expect(result.current.pathUpdated).toBe(true));
    });

    it('does not flag an update again once the new version has been recorded', async () => {
        window.localStorage.setItem('competency-graph-version-seen:user1', '1');
        server.use(
            http.get('/api/v1/onboarding/me/path', () => HttpResponse.json(pathResponse(2))),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));
        await waitFor(() => expect(result.current.pathUpdated).toBe(true));

        act(() => {
            void result.current.retry();
        });

        await waitFor(() => {
            expect(result.current.pathUpdated).toBe(false);
        });
    });

    it('reports no just-changed keys on the very first load', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/path', () => HttpResponse.json(pathResponse(1))),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.justChangedKeys.size).toBe(0);
    });

    it('flags a node whose state changed since the previous load', async () => {
        let version = 1;
        server.use(
            http.get('/api/v1/onboarding/me/path', () =>
                HttpResponse.json(pathResponse(version, version === 1 ? 'AVAILABLE' : 'MASTERED')),
            ),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.justChangedKeys.size).toBe(0);

        version = 2;
        act(() => {
            void result.current.retry();
        });

        await waitFor(() => expect(result.current.path?.graphVersion).toBe(2));
        expect(result.current.justChangedKeys.has('kotlin')).toBe(true);
    });

    it('treats an empty path as an answer, not a failure', async () => {
        // The path is derived on every read, so "nothing selected by the baseline"
        // comes back as an empty path rather than a 404 to recover from.
        server.use(
            http.get('/api/v1/onboarding/me/path', () =>
                HttpResponse.json({ nodes: [], edges: [], graphVersion: 1 }),
            ),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBeNull();
        expect(result.current.path?.nodes).toEqual([]);
    });

    it('stays idle and does not fetch when no project is selected', async () => {
        let requested = false;
        server.use(
            http.get('/api/v1/onboarding/me/path', () => {
                requested = true;
                return HttpResponse.json(pathResponse(1));
            }),
        );

        const { result } = renderHook(() => useCompetencyPath(undefined));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.path).toBeNull();
        expect(result.current.error).toBeNull();
        expect(requested).toBe(false);
    });

    it('passes the selected project id as a query param', async () => {
        let seenProjectId: string | null = null;
        server.use(
            http.get('/api/v1/onboarding/me/path', ({ request }) => {
                seenProjectId = new URL(request.url).searchParams.get('projectId');
                return HttpResponse.json(pathResponse(1));
            }),
        );

        const { result } = renderHook(() => useCompetencyPath('proj-42'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(seenProjectId).toBe('proj-42');
    });

    it('sets an error when the fetch fails, and retry re-attempts it', async () => {
        let attempts = 0;
        server.use(
            http.get('/api/v1/onboarding/me/path', () => {
                attempts += 1;
                if (attempts === 1) return new HttpResponse(null, { status: 503 });
                return HttpResponse.json(pathResponse(1));
            }),
        );

        const { result } = renderHook(() => useCompetencyPath('proj1'));
        await waitFor(() => expect(result.current.error).not.toBeNull());

        act(() => {
            void result.current.retry();
        });

        await waitFor(() => {
            expect(result.current.error).toBeNull();
            expect(result.current.path?.graphVersion).toBe(1);
        });
    });
});
