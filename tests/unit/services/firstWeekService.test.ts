import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstWeekService } from '../../../src/services/firstWeekService';
import { apiClient } from '../../../src/services/apiClient';

describe('firstWeekService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('reads environment readiness scoped to the project', async () => {
        const env = { ready: false, readyAt: null, evidence: null, evidenceDetail: null, derived: false };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(env);

        await expect(firstWeekService.fetchEnvironment('p1')).resolves.toEqual(env);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/environment?projectId=p1');
    });

    it('reads Task 0 scoped to the project', async () => {
        const task = { ready: true, task: null, assignedAt: null, noneAvailable: true, loopProven: false };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(task);

        await expect(firstWeekService.fetchTaskZero('p1')).resolves.toEqual(task);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/task-zero?projectId=p1');
    });

    it('hands a Task 0 back with a DELETE', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await firstWeekService.unassignTaskZero('p1');
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/task-zero?projectId=p1', {
            method: 'DELETE'
        });
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        await expect(firstWeekService.fetchEnvironment('p1')).rejects.toThrow('boom');
    });
});
