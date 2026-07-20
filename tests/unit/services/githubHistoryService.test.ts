import { describe, it, expect, vi, beforeEach } from 'vitest';
import { githubHistoryService } from '../../../src/services/githubHistoryService';
import { apiClient } from '../../../src/services/apiClient';

describe('githubHistoryService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('reads the full record held about the user', async () => {
        const prior = {
            consented: true,
            signals: { 'repo:owner/api': 9 },
            computedAt: '2026-07-20T00:00:00Z',
        };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(prior);

        await expect(githubHistoryService.fetchPrior()).resolves.toEqual(prior);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/github-history');
    });

    it('returns what was derived immediately on opting in', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue({
            consented: true,
            signals: {},
            computedAt: '2026-07-20T00:00:00Z',
        });

        await githubHistoryService.grantConsent();

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/v1/onboarding/me/github-history/consent',
            { method: 'POST' },
        );
    });

    it('withdraws consent via DELETE, which also deletes the derived record', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await githubHistoryService.revokeConsent();

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/v1/onboarding/me/github-history/consent',
            { method: 'DELETE' },
        );
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        await expect(githubHistoryService.fetchPrior()).rejects.toThrow('boom');
    });
});
