import { describe, it, expect, vi, beforeEach } from 'vitest';
import { competencyGraphService } from '../../../src/services/competencyGraphService';
import { http, HttpResponse } from 'msw';
import { mockKeycloakInstance, server } from '../../unit/setup/vitest.setup';

describe('competencyGraphService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockKeycloakInstance.authenticated = true;
        mockKeycloakInstance.token = 'test-token';
        mockKeycloakInstance.updateToken.mockResolvedValue(true);
    });

    it('generate triggers AI proposal generation', async () => {
        server.use(
            http.post('/api/v1/onboarding/competency-graph/generate', () =>
                HttpResponse.json({
                    status: 'proposed',
                    competenciesProposed: 3,
                    edgesProposed: 2,
                    notes: ['seeded from README.md'],
                }),
            ),
        );

        const result = await competencyGraphService.generate();
        expect(result.competenciesProposed).toBe(3);
        expect(result.edgesProposed).toBe(2);
    });

    it('fetchProposed returns pending competencies and edges', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () =>
                HttpResponse.json({
                    competencies: [
                        {
                            id: 'c1',
                            key: 'kotlin',
                            label: 'Kotlin',
                            description: null,
                            kind: 'SKILL',
                            repoRef: null,
                            status: 'PROPOSED',
                        },
                    ],
                    edges: [
                        {
                            id: 'e1',
                            fromKey: 'kotlin',
                            toKey: 'jpa',
                            kind: 'PREREQUISITE',
                            rationale: null,
                            status: 'PROPOSED',
                        },
                    ],
                }),
            ),
        );

        const result = await competencyGraphService.fetchProposed();
        expect(result.competencies).toHaveLength(1);
        expect(result.edges).toHaveLength(1);
    });

    it('approveCompetency posts with no body', async () => {
        let capturedBody = '';
        server.use(
            http.post('/api/v1/onboarding/competency-graph/competencies/c1/approve', async ({ request }) => {
                capturedBody = await request.text();
                return HttpResponse.json({
                    id: 'c1',
                    key: 'kotlin',
                    label: 'Kotlin',
                    description: null,
                    kind: 'SKILL',
                    repoRef: null,
                    status: 'APPROVED',
                });
            }),
        );

        const result = await competencyGraphService.approveCompetency('c1');
        expect(result.status).toBe('APPROVED');
        expect(capturedBody).toBe('');
    });

    it('rejectCompetency posts an optional reason', async () => {
        let capturedBody: unknown = null;
        server.use(
            http.post('/api/v1/onboarding/competency-graph/competencies/c1/reject', async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({
                    id: 'c1',
                    key: 'kotlin',
                    label: 'Kotlin',
                    description: null,
                    kind: 'SKILL',
                    repoRef: null,
                    status: 'REJECTED',
                });
            }),
        );

        const result = await competencyGraphService.rejectCompetency('c1', 'duplicate');
        expect(result.status).toBe('REJECTED');
        expect(capturedBody).toEqual({ reason: 'duplicate' });
    });

    it('approveEdge posts with no body', async () => {
        server.use(
            http.post('/api/v1/onboarding/competency-graph/edges/e1/approve', () =>
                HttpResponse.json({
                    id: 'e1',
                    fromKey: 'kotlin',
                    toKey: 'jpa',
                    kind: 'PREREQUISITE',
                    rationale: null,
                    status: 'APPROVED',
                }),
            ),
        );

        const result = await competencyGraphService.approveEdge('e1');
        expect(result.status).toBe('APPROVED');
    });

    it('rejectEdge posts an optional reason', async () => {
        let capturedBody: unknown = null;
        server.use(
            http.post('/api/v1/onboarding/competency-graph/edges/e1/reject', async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({
                    id: 'e1',
                    fromKey: 'kotlin',
                    toKey: 'jpa',
                    kind: 'PREREQUISITE',
                    rationale: null,
                    status: 'REJECTED',
                });
            }),
        );

        await competencyGraphService.rejectEdge('e1');
        expect(capturedBody).toEqual({ reason: undefined });
    });
});
