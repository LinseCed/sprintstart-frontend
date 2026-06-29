import type { ReactNode } from 'react';
import { useEffect, useState, useRef } from 'react';
import { userService } from '../services/userService';
import { PermissionGroup, type UserProfile } from '../services/types';
import { AuthContext, type AuthStatus } from './AuthContext';
import keycloak from '../config/keycloak';
import { ensureDefaultGithubPatFromEnv } from '../services/sources/githubService';

/**
 * Provider component that manages the global authentication state via Keycloak.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const isInitialized = useRef(false);
    const isGithubPatBootstrapped = useRef(false);

    useEffect(() => {
        /**
         * Initializes Keycloak and sets up the authentication status.
         */
        const initAuth = async () => {
            if (isInitialized.current) return;
            isInitialized.current = true;

            try {
                const authenticated = await keycloak.init({
                    onLoad: 'check-sso',
                    pkceMethod: 'S256',
                    checkLoginIframe: false
                });

                if (authenticated) {
                    const data = await userService.getProfile();

                    if (data) {
                        if (isAdmin(data)) {
                            await bootstrapAdminGithubPat(isGithubPatBootstrapped);
                        }
                        setProfile(data);
                        setStatus('authenticated');
                    } else {
                        // User exists in Keycloak but not in Backend DB yet
                        // In a real app, we might trigger a registration or show a setup page
                        console.warn("User authenticated in Keycloak but no profile found in backend.");
                        setStatus('unauthenticated');
                    }
                } else {
                    setStatus('unauthenticated');
                }
            } catch (error) {
                console.error('Keycloak initialization failed', error);
                setStatus('unauthenticated');
            }
        };

        void initAuth();
    }, []);

    const login = async () => {
        await keycloak.login();
    };

    const logout = async () => {
        await keycloak.logout();
    };
    
    const refetchProfile = async () => {
        const data = await userService.getProfile();
        if (data) {
            if (isAdmin(data)) {
                await bootstrapAdminGithubPat(isGithubPatBootstrapped);
            }
            setProfile(data);
        }
    };

    return (
        <AuthContext.Provider value={{ status, profile, login, logout, refetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

function isAdmin(profile: UserProfile): boolean {
    return profile.permissionGroup === PermissionGroup.ADMIN;
}

async function bootstrapAdminGithubPat(bootstrappedRef: { current: boolean }): Promise<void> {
    if (bootstrappedRef.current) {
        return;
    }

    bootstrappedRef.current = true;
    try {
        await ensureDefaultGithubPatFromEnv();
    } catch (error) {
        console.warn('Failed to bootstrap configured GitHub PAT for admin user.', error);
    }
}
