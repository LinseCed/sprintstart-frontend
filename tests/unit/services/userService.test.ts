/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from '../../../src/services/userService';
import { apiClient } from '../../../src/services/apiClient';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn(),
    }
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('getProfile fetches backend profile and merges local mock', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({ id: '123', email: 'backend@example.com' });
        
        // Setup local mock data in session storage
        sessionStorage.setItem('sprintstart_mock_profile', JSON.stringify({ firstName: 'Local' }));

        const profile = await userService.getProfile();
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/users/me');
        expect(profile?.id).toBe('123');
        expect(profile?.email).toBe('backend@example.com');
        expect(profile?.firstName).toBe('Local'); // Merged from session storage
    });

    it('getProfile returns null on error', async () => {
        vi.mocked(apiClient.fetch).mockRejectedValue(new Error('Failed'));
        const profile = await userService.getProfile();
        expect(profile).toBeNull();
    });

    it('updateProfile patches backend and updates local mock storage', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({ id: '123', firstName: 'NewName' });
        
        const updated = await userService.updateProfile({ firstName: 'NewName', profileIcon: 'icon1' });
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ firstName: 'NewName', profileIcon: 'icon1' })
        });

        expect(updated.firstName).toBe('NewName');
        expect(updated.profileIcon).toBe('icon1');

        // Check if session storage holds the local fields
        const stored = JSON.parse(sessionStorage.getItem('sprintstart_mock_profile') || '{}');
        expect(stored.firstName).toBe('NewName');
        expect(stored.profileIcon).toBe('icon1');
    });

    it('updateProfile falls back to local storage if backend fails', async () => {
        // Mock getProfile which is called on failure
        vi.mocked(apiClient.fetch)
            .mockRejectedValueOnce(new Error('Backend error'))
            .mockResolvedValueOnce({ id: '123', firstName: 'OldName' }); // For getProfile fallback

        const updated = await userService.updateProfile({ firstName: 'FallbackName' });
        
        expect(updated.firstName).toBe('FallbackName');
        
        const stored = JSON.parse(sessionStorage.getItem('sprintstart_mock_profile') || '{}');
        expect(stored.firstName).toBe('FallbackName');
    });
});
