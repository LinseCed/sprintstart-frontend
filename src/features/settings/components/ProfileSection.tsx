import { Loader2 } from 'lucide-react';
import { useProfile } from '../../../features/profile/useProfile';
import { AccountForm } from '../../../features/profile/components/AccountForm';
import { GithubHistorySection } from '../../../features/profile/components/GithubHistorySection';
import { PasswordForm } from '../../../features/profile/components/PasswordForm';

/**
 * Profile section of the settings page. Reuses the existing account and
 * password forms (per story: reuse, no rebuild) and the shared `useProfile`
 * hook so profile loading and update behaviour match the legacy profile page.
 */
export function ProfileSection() {
    const { profile, isLoading, error, updateProfile } = useProfile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-app-brand" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <p className="py-8 text-center text-sm text-app-text-muted">
                {error ?? 'Failed to load profile data.'}
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <AccountForm profile={profile} onUpdate={updateProfile} />
            {/* Sits right after the GitHub username field it depends on: without a
                username there is nothing to attribute the user's work to. */}
            <GithubHistorySection />
            <PasswordForm />
        </div>
    );
}
