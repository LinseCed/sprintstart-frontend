import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { userService } from '../../services/userService';
import type { UserProfile } from '../../services/types';

/**
 * Loads the current user's profile and exposes an `updateProfile` action that
 * also refreshes the global {@link AuthProvider} profile (so the sidebar /
 * avatar update immediately). Shared by the settings profile section and the
 * legacy profile layout so behaviour stays identical.
 */
export function useProfile() {
    const { refetchProfile } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        userService
            .getProfile()
            .then((data) => {
                if (!mounted) return;
                if (data) {
                    setProfile(data);
                }
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                console.error('Failed to load profile', err);
                if (!mounted) return;
                setError('Failed to load profile data.');
                setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            // Workaround: Backend requires projectsId on PATCH requests
            const payload = {
                ...updates,
                projectIds: profile?.projectIds ?? [],
            };
            const updatedProfile = await userService.updateProfile(payload);
            setProfile(updatedProfile);
            await refetchProfile();
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    };

    return { profile, isLoading, error, updateProfile };
}
