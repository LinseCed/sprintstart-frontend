import { ProfileLayout } from '../features/profile/components/ProfileLayout';

/**
 * Main container for user profile management and settings.
 */
export function ProfilePage() {
    return (
        <div className="h-full min-h-screen w-full bg-app-bg">
            <ProfileLayout />
        </div>
    );
}
