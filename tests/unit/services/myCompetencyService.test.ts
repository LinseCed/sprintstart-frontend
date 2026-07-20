import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myCompetencyService } from '../../../src/services/myCompetencyService';
import { apiClient } from '../../../src/services/apiClient';

describe('myCompetencyService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches the global ledger without a project scope', async () => {
        const rows = [
            {
                competencyKey: 'kotlin',
                label: 'Kotlin',
                kind: 'SKILL' as const,
                level: 3,
                source: 'VERIFIED' as const,
                updatedAt: '2026-07-01T00:00:00Z',
            },
        ];
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(rows);

        await expect(myCompetencyService.fetchMyCompetencies()).resolves.toEqual(rows);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/competencies');
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        await expect(myCompetencyService.fetchMyCompetencies()).rejects.toThrow('boom');
    });
});
