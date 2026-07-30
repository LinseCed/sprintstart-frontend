import { AppRouter } from './router/AppRouter';
import { SideBar } from './components/layout/SideBar';
import { AuthProvider } from './context/AuthProvider';
import { ChatProvider } from './context/ChatProvider';
import { ChatPreferencesProvider } from './context/ChatPreferencesProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { ProjectProvider } from './features/projects/ProjectProvider';
import { useAuth } from './context/useAuth';
import { BuddyWidget } from './features/buddy/components/BuddyWidget';
import { PermissionGroup } from './services/types';

function AppContent() {
    const { status, profile } = useAuth();

    // Show sidebar only if logged in (even if onboarding is needed)
    const showSidebar = status !== 'unauthenticated' && status !== 'loading';

    // The buddy is a hire's onboarding companion -- the backend hard-requires the USER role,
    // so PM/ADMIN/HR profiles never see it.
    const showBuddy = showSidebar && profile?.permissionGroup === PermissionGroup.USER;

    return (
        <div className="flex min-h-screen w-full bg-app-bg text-app-text">
            {showSidebar && <SideBar />}

            <main className="min-h-screen min-w-0 flex-1 bg-app-bg pt-[64px] lg:pt-0">
                <AppRouter />
            </main>

            {showBuddy && <BuddyWidget />}
        </div>
    );
}

function App() {
    // ProjectProvider sits inside AuthProvider: which projects are loaded
    // depends on the authenticated user's permission group.
    return (
        <ThemeProvider>
            <AuthProvider>
                <ProjectProvider>
                    <ChatProvider>
                        <ChatPreferencesProvider>
                            <AppContent />
                        </ChatPreferencesProvider>
                    </ChatProvider>
                </ProjectProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;