import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { knowledgeGapService } from '../../../src/services/knowledgeGapService';
import { server } from '../../unit/setup/vitest.setup';

describe('knowledgeGapService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchKnowledgeGaps', () => {
        it('returns the backend overview on success', async () => {
            const overview = {
                totalGaps: 3,
                severitySummary: { high: 1, medium: 1, low: 1 },
                gaps: [{ id: 'g1', title: 'Gap 1', severity: 'high' }],
            };
            server.use(
                http.get('/api/v1/insights/knowledge-gaps', () => HttpResponse.json(overview)),
            );

            const result = await knowledgeGapService.fetchKnowledgeGaps();

            expect(result).toEqual(overview);
        });

        it('propagates a server error instead of inventing gaps', async () => {
            server.use(
                http.get('/api/v1/insights/knowledge-gaps', () => HttpResponse.json({}, { status: 500 })),
            );

            await expect(knowledgeGapService.fetchKnowledgeGaps()).rejects.toThrow();
        });

        it('propagates a 404 rather than showing fabricated gaps for an empty result', async () => {
            // The old fallback fired on any error including 404, so a genuinely empty backend
            // showed mock gaps. The page renders a real empty state instead.
            server.use(
                http.get('/api/v1/insights/knowledge-gaps', () => new HttpResponse(null, { status: 404 })),
            );

            await expect(knowledgeGapService.fetchKnowledgeGaps()).rejects.toThrow();
        });
    });

    describe('fetchKnowledgeGap', () => {
        it('returns the backend gap detail on success', async () => {
            const detail = { id: 'g1', title: 'Gap 1', severity: 'high', missingTypes: [] };
            server.use(
                http.get('/api/v1/insights/knowledge-gaps/g1', () => HttpResponse.json(detail)),
            );

            const result = await knowledgeGapService.fetchKnowledgeGap('g1');

            expect(result).toEqual(detail);
        });

        it('propagates a 404 instead of returning a fixture', async () => {
            server.use(
                http.get('/api/v1/insights/knowledge-gaps/missing', () => new HttpResponse(null, { status: 404 })),
            );

            await expect(knowledgeGapService.fetchKnowledgeGap('missing')).rejects.toThrow();
        });

        it('propagates a server error instead of returning a fixture', async () => {
            server.use(
                http.get('/api/v1/insights/knowledge-gaps/g2', () => HttpResponse.json({}, { status: 500 })),
            );

            await expect(knowledgeGapService.fetchKnowledgeGap('g2')).rejects.toThrow();
        });
    });
});
