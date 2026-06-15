import type { ReactNode } from 'react';
import { useEffect, useState, useRef } from 'react';
import { userService } from '../services/userService';
import type { UserProfile } from '../services/types';
import { AuthContext, type AuthStatus } from './AuthContext';
import keycloak from '../config/keycloak';

const BASE_API_URL = '/api/v1';

/**
 * Triggers the backend onboarding path generation for a user.
 */
const seedOnboardingPath = async (userId: string) => {
    try {
        await fetch(`${BASE_API_URL}/onboarding/${userId}/seeding`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${keycloak.token}`
            }
        });
    } catch (error) {
        console.warn("Backend onboarding seeding failed:", error);
    }
};

/**
 * Provider component that manages the global authentication state via Keycloak.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const isInitialized = useRef(false);

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
                        await seedOnboardingPath(data.id);
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
        if (data) setProfile(data);
    };

    return (
        <AuthContext.Provider value={{ status, profile, login, logout, refetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
