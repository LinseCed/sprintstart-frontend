import { describe, it, expect, vi, beforeEach } from 'vitest';
import { competencyGraphService } from '../../../src/services/competencyGraphService';
import { http, HttpResponse } from 'msw';
import { mockKeycloakInstance, server } from '../../unit/setup/vitest.setup';

const BASE = '/api/v1/onboarding/competency-graph';

describe('competencyGraphService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockKeycloakInstance.authenticated = true;
        mockKeycloakInstance.token = 'test-token';
        mockKeycloakInstance.updateToken.mockResolvedValue(true);
    });

    it('fetchGraph returns the live vocabulary as a flat list', async () => {
        server.use(
            http.get(BASE, () =>
                HttpResponse.json({
                    competencies: [
                        {
                            key: 'kotlin',
                            label: 'Kotlin',
                            description: null,
                            kind: 'SKILL',
                            targetLevel: 2,
                        },
                    ],
                }),
            ),
        );

        const result = await competencyGraphService.fetchGraph();
        expect(result.competencies).toHaveLength(1);
        expect(result.competencies[0].key).toBe('kotlin');
    });

    it('createCompetency sends the whole input and returns the slugified key', async () => {
        let capturedBody: unknown = null;
        server.use(
            http.post(`${BASE}/competencies`, async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({
                    key: 'docker-compose',
                    label: 'Docker Compose',
                    description: null,
                    kind: 'SKILL',
                    targetLevel: 2,
                });
            }),
        );

        const result = await competencyGraphService.createCompetency({
            key: 'Docker Compose',
            label: 'Docker Compose',
            kind: 'SKILL',
        });

        expect(capturedBody).toEqual({ key: 'Docker Compose', label: 'Docker Compose', kind: 'SKILL' });
        expect(result.key).toBe('docker-compose');
    });

    it('updateCompetency puts only the fields it was given', async () => {
        let capturedBody: unknown = null;
        server.use(
            http.put(`${BASE}/competencies/kotlin`, async ({ request }) => {
                capturedBody = await request.json();
                return HttpResponse.json({
                    key: 'kotlin',
                    label: 'Kotlin',
                    description: null,
                    kind: 'SKILL',
                    targetLevel: 3,
                });
            }),
        );

        const result = await competencyGraphService.updateCompetency('kotlin', { targetLevel: 3 });
        expect(capturedBody).toEqual({ targetLevel: 3 });
        expect(result.targetLevel).toBe(3);
    });

    it('deleteCompetency answers with the key it removed', async () => {
        server.use(
            http.delete(`${BASE}/competencies/kotlin`, () => HttpResponse.json({ key: 'kotlin' })),
        );

        const result = await competencyGraphService.deleteCompetency('kotlin');
        expect(result).toEqual({ key: 'kotlin' });
    });

    it('encodes a key that is not URL-safe', async () => {
        let capturedPath = '';
        server.use(
            http.get(`${BASE}/competencies/:key`, ({ request }) => {
                capturedPath = new URL(request.url).pathname;
                return HttpResponse.json({
                    key: 'c/c++',
                    label: 'C/C++',
                    description: null,
                    kind: 'SKILL',
                    targetLevel: 2,
                });
            }),
        );

        await competencyGraphService.fetchCompetency('c/c++');
        expect(capturedPath).toContain('c%2Fc%2B%2B');
    });
});
