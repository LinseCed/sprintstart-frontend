import { describe, it, expect, vi, beforeEach } from 'vitest';
import { humanLoopService } from '../../../src/services/humanLoopService';
import { apiClient } from '../../../src/services/apiClient';

describe('humanLoopService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('scopes the buddy read to the project and returns the buddy', async () => {
        const buddy = { buddyId: 'b1', buddyName: 'Ada', buddyGithubLogin: 'ada' };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(buddy);

        await expect(humanLoopService.fetchMyBuddy('p1')).resolves.toEqual(buddy);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/buddy?projectId=p1');
    });

    it('normalizes a 204 (empty body) to null rather than a bogus buddy', async () => {
        // apiClient returns {} for a no-content response; "no buddy yet" is a real state.
        vi.spyOn(apiClient, 'fetch').mockResolvedValue({});

        await expect(humanLoopService.fetchMyBuddy('p1')).resolves.toBeNull();
    });

    it('reads the mentees list and unwraps the array', async () => {
        const mentees = [{ hireId: 'h1', hireName: 'Bo', alerts: [] }];
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue({ mentees });

        await expect(humanLoopService.fetchMyMentees()).resolves.toEqual(mentees);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/mentees');
    });

    it('reads the caller-scoped timeline from /metrics/me', async () => {
        const timeline = { userId: 'u1', longestOpenWaitHours: 72 };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(timeline);

        await expect(humanLoopService.fetchMyTimeline('p1')).resolves.toEqual(timeline);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/metrics/me?projectId=p1');
    });

    it('logs a hire self-contact with no body fields', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await humanLoopService.logContact('p1');
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/buddy/contacts?projectId=p1', {
            method: 'POST',
            body: JSON.stringify({})
        });
    });

    it('logs a contact on a hire\'s behalf by naming the hire', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await humanLoopService.logContact('p1', { hireId: 'h9' });
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/buddy/contacts?projectId=p1', {
            method: 'POST',
            body: JSON.stringify({ hireId: 'h9' })
        });
    });

    it('assigns and unassigns buddies on the project-scoped endpoints', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await humanLoopService.assignBuddy('p1', { hireId: 'h1', buddyId: 'b1', cadenceTargetDays: 7 });
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/projects/p1/buddies', {
            method: 'POST',
            body: JSON.stringify({ hireId: 'h1', buddyId: 'b1', cadenceTargetDays: 7 })
        });

        await humanLoopService.unassignBuddy('p1', 'h1');
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/projects/p1/buddies/h1', {
            method: 'DELETE'
        });
    });

    it('reads the attention list for a project', async () => {
        const attention = { projectId: 'p1', memberCount: 3, withBuddyCount: 2, recentContactCount: 4, items: [] };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(attention);

        await expect(humanLoopService.fetchAttention('p1')).resolves.toEqual(attention);
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/projects/p1/attention');
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        await expect(humanLoopService.fetchAttention('p1')).rejects.toThrow('boom');
    });
});
