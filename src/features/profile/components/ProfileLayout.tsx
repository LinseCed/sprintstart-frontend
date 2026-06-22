import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { userService } from '../../../services/userService';
import type { UserProfile } from '../../../services/types';
import { AccountForm } from './AccountForm';
import { PasswordForm } from './PasswordForm';
import { SkillsAssessment } from './SkillsAssessment';
import { Loader2 } from 'lucide-react';

/**
 * Wrapper layout for the profile settings view.
 * Coordinates loading of the user profile and passes data to specific forms.
 */
export function ProfileLayout() {
    const { refetchProfile } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        userService.getProfile()
            .then(data => {
                if (mounted && data) {
                    setProfile(data);
                }
                if (mounted) setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load profile', err);
                if (mounted) setIsLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
        try {
            const updatedProfile = await userService.updateProfile(updates);
            setProfile(updatedProfile);
            await refetchProfile();
        } catch (error) {
            console.error('Failed to update profile', error);
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-full w-full items-center justify-center text-app-text-muted">
                Failed to load profile data.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-app-text">User Profile</h1>
                <p className="text-app-text-muted">
                    Manage your account settings, password, and skill assessments.
                </p>
            </div>

            <AccountForm profile={profile} onUpdate={handleUpdateProfile} />
            <PasswordForm />
            <SkillsAssessment profile={profile} onUpdate={handleUpdateProfile} />
        </div>
    );
}
