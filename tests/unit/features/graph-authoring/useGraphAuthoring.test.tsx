import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGraphAuthoring } from '../../../../src/features/graph-authoring/hooks/useGraphAuthoring';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup/vitest.setup';

const competency = {
    id: 'c1',
    key: 'kotlin',
    label: 'Kotlin',
    description: null,
    kind: 'SKILL',
    repoRef: null,
    status: 'PROPOSED',
};

const edge = {
    id: 'e1',
    fromKey: 'kotlin',
    toKey: 'jpa',
    kind: 'PREREQUISITE',
    rationale: null,
    status: 'PROPOSED',
};

describe('useGraphAuthoring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads proposed competencies and edges on mount', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () =>
                HttpResponse.json({ competencies: [competency], edges: [edge] }),
            ),
        );

        const { result } = renderHook(() => useGraphAuthoring());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.competencies).toHaveLength(1);
        expect(result.current.edges).toHaveLength(1);
    });

    it('generate triggers a refetch and surfaces the result', async () => {
        let proposedCallCount = 0;
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () => {
                proposedCallCount += 1;
                return HttpResponse.json({ competencies: [], edges: [] });
            }),
            http.post('/api/v1/onboarding/competency-graph/generate', () =>
                HttpResponse.json({ status: 'proposed', competenciesProposed: 2, edgesProposed: 1, notes: [] }),
            ),
        );

        const { result } = renderHook(() => useGraphAuthoring());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(proposedCallCount).toBe(1);

        await act(async () => {
            await result.current.generate();
        });

        expect(proposedCallCount).toBe(2);
        expect(result.current.generateResult?.competenciesProposed).toBe(2);
    });

    it('approveCompetency removes the item from pending state', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () =>
                HttpResponse.json({ competencies: [competency], edges: [] }),
            ),
            http.post('/api/v1/onboarding/competency-graph/competencies/c1/approve', () =>
                HttpResponse.json({ ...competency, status: 'APPROVED' }),
            ),
        );

        const { result } = renderHook(() => useGraphAuthoring());
        await waitFor(() => expect(result.current.competencies).toHaveLength(1));

        await act(async () => {
            await result.current.approveCompetency('c1');
        });

        expect(result.current.competencies).toHaveLength(0);
    });

    it('rejectEdge removes the item from pending state', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () =>
                HttpResponse.json({ competencies: [], edges: [edge] }),
            ),
            http.post('/api/v1/onboarding/competency-graph/edges/e1/reject', () =>
                HttpResponse.json({ ...edge, status: 'REJECTED' }),
            ),
        );

        const { result } = renderHook(() => useGraphAuthoring());
        await waitFor(() => expect(result.current.edges).toHaveLength(1));

        await act(async () => {
            await result.current.rejectEdge('e1', 'not relevant');
        });

        expect(result.current.edges).toHaveLength(0);
    });

    it('surfaces an error when loading proposals fails', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () =>
                new HttpResponse(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useGraphAuthoring());

        await waitFor(() => {
            expect(result.current.error).toBeTruthy();
        });
        expect(result.current.isLoading).toBe(false);
    });
});
