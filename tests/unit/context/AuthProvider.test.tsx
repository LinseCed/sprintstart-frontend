import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AuthProvider } from '../../../src/context/AuthProvider';
import { AuthContext } from '../../../src/context/AuthContext';
import keycloak from '../../../src/config/keycloak';
import { userService } from '../../../src/services/userService';
import { PermissionGroup } from '../../../src/services/types';
import type { UserProfile } from '../../../src/services/types';

// Mock dependencies
vi.mock('../../../src/config/keycloak', () => {
    return {
        default: {
            init: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
        }
    };
});

vi.mock('../../../src/services/userService', () => {
    return {
        userService: {
            getProfile: vi.fn(),
            updateProfile: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
        }
    };
});

const mockProfile: UserProfile = {
    id: '1',
    authId: 'auth-1',
    username: 'test',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    projectRoles: [],
    permissionGroup: PermissionGroup.USER,
    enabled: true,
    profileIcon: null,
    hasCompletedOnboarding: true,
};

// Dummy consumer to read context state
const DummyConsumer = () => {
    const { status, profile } = useContext(AuthContext)!;
    return (
        <div>
            <span data-testid="status">{status}</span>
            <span data-testid="profile-name">{profile ? profile.username : 'none'}</span>
        </div>
    );
};

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('verifies provider starts in loading state', () => {
        // Prevent init from resolving immediately to observe loading state
        vi.mocked(keycloak.init).mockReturnValue(new Promise(() => {}));
        
        render(
            <AuthProvider>
                <DummyConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('status')).toHaveTextContent('loading');
    });

    it('transitions to authenticated on successful SSO flow', async () => {
        vi.mocked(keycloak.init).mockResolvedValue(true);
        vi.mocked(userService.getProfile).mockResolvedValue(mockProfile);

        render(
            <AuthProvider>
                <DummyConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        });
        expect(screen.getByTestId('profile-name')).toHaveTextContent('test');
    });

    it('transitions to unauthenticated on failed SSO flow', async () => {
        vi.mocked(keycloak.init).mockResolvedValue(false);

        render(
            <AuthProvider>
                <DummyConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
        });
        expect(userService.getProfile).not.toHaveBeenCalled();
    });

    it('handles backend retry logic and catches profile', async () => {
        vi.mocked(keycloak.init).mockResolvedValue(true);
        
        // Return null on first call, then mockProfile on second
        vi.mocked(userService.getProfile)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(mockProfile);

        render(
            <AuthProvider>
                <DummyConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
        }, { timeout: 3000 }); // Retry delay is 1000ms, wait enough time
        
        expect(userService.getProfile).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('profile-name')).toHaveTextContent('test');
    });
});
