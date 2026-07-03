import { useAuth } from '../context/useAuth';
import { UserAvatar } from '../components/common/UserAvatar';

/**
 * Central hub displayed after login.
 * Shows high-level project status and provides quick actions for the user.
 */
export function DashboardPage() {
    const { profile } = useAuth();
    
    // Safely fallback to 'User' if profile isn't loaded yet
    const displayName = profile?.firstName || profile?.username || 'User';

    return (
        <div className="flex h-full min-h-[80vh] flex-col p-8">
            {/* Centered Greeting */}
            <div className="flex flex-1 items-center justify-center">
                <h1 className="text-5xl font-bold tracking-tight text-app-text">
                    Hello, {displayName}
                </h1>
            </div>

            {/* Avatar at the bottom */}
            <div className="flex justify-center pb-12">
                <UserAvatar 
                    size={100} 
                    profileIcon={profile?.profileIcon} 
                    fallbackName={displayName} 
                />
            </div>
        </div>
    );
}