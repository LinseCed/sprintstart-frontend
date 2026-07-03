import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from '../../../src/services/userService';
import { http, HttpResponse } from 'msw';
import { server } from '../../unit/setup/vitest.setup';

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('getProfile returns merged backend and local mock data', async () => {
        server.use(
            http.get('/api/v1/users/me', () =>
                HttpResponse.json({
                    id: '123',
                    authId: 'auth-123',
                    username: 'testuser',
                    email: 'backend@example.com',
                    firstName: 'Backend',
                    lastName: 'User',
                    projectRoles: [],
                    permissionGroup: 'USER',
                    enabled: true,
                    profileIcon: null,
                    hasCompletedOnboarding: true,
                }),
            ),
        );

        sessionStorage.setItem(
            'sprintstart_mock_profile',
            JSON.stringify({ firstName: 'Local' }),
        );

        const profile = await userService.getProfile();
        expect(profile?.id).toBe('123');
        expect(profile?.email).toBe('backend@example.com');
        expect(profile?.firstName).toBe('Local');
    });

    it('getProfile returns null on error', async () => {
        server.use(
            http.get('/api/v1/users/me', () => HttpResponse.error()),
        );

        const profile = await userService.getProfile();
        expect(profile).toBeNull();
    });

    it('updateProfile patches backend and stores local fields', async () => {
        server.use(
            http.patch('/api/v1/users/me', async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({
                    id: '123',
                    authId: 'auth-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: body.firstName as string,
                    lastName: 'User',
                    projectRoles: [],
                    permissionGroup: 'USER',
                    enabled: true,
                    profileIcon: (body.profileIcon as string) ?? null,
                    hasCompletedOnboarding: true,
                });
            }),
        );

        const updated = await userService.updateProfile({
            firstName: 'NewName',
            profileIcon: 'icon1',
        });

        expect(updated.firstName).toBe('NewName');
        expect(updated.profileIcon).toBe('icon1');

        const stored = JSON.parse(
            sessionStorage.getItem('sprintstart_mock_profile') || '{}',
        );
        expect(stored.firstName).toBe('NewName');
        expect(stored.profileIcon).toBe('icon1');
    });

    it('updateProfile falls back to local storage if backend fails', async () => {
        server.use(
            http.patch('/api/v1/users/me', () => HttpResponse.error()),
        );

        const updated = await userService.updateProfile({ firstName: 'FallbackName' });
        expect(updated.firstName).toBe('FallbackName');

        const stored = JSON.parse(
            sessionStorage.getItem('sprintstart_mock_profile') || '{}',
        );
        expect(stored.firstName).toBe('FallbackName');
    });
});
