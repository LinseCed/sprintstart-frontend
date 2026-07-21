import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orientationService } from '../../../src/services/orientationService';
import { apiClient } from '../../../src/services/apiClient';

describe('orientationService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('reads orientation scoped to the project', async () => {
        const orientation = {
            taskId: 't1',
            taskTitle: 'Fix the header',
            taskUrl: null,
            packet: null,
            reason: 'corpus is empty'
        };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(orientation);

        await expect(orientationService.fetchMyOrientation('p1')).resolves.toEqual(orientation);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/orientation?projectId=p1');
    });

    it('reports stale orientation as page-less feedback', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await orientationService.reportStaleOrientation('The setup section is out of date.');

        // A packet is disposable, so there is no durable page to attach this to.
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/feedback', {
            method: 'POST',
            body: JSON.stringify({
                pageId: null,
                helpful: false,
                message: 'The setup section is out of date.'
            })
        });
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        // There is no cached or placeholder packet to fall back to, by design.
        await expect(orientationService.fetchMyOrientation('p1')).rejects.toThrow('boom');
    });
});
