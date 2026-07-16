import { Settings, User, Palette, MessageSquare, Key } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { PageHeader } from '../components/layout/PageHeader';
import { SettingsSection } from '../features/settings/components/SettingsSection';
import { ProfileSection } from '../features/settings/components/ProfileSection';
import { AppearanceSection } from '../features/settings/components/AppearanceSection';
import { ChatSection } from '../features/settings/components/ChatSection';
import { TokensSection } from '../features/settings/components/TokensSection';

const SECTIONS = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'tokens', label: 'Access Tokens', icon: Key },
] as const;

const PAT_ALLOWED_GROUPS: ReadonlySet<PermissionGroup> = new Set([
    PermissionGroup.PM,
    PermissionGroup.HR,
    PermissionGroup.ADMIN,
]);

/**
 * Central settings hub — a single scrollable page grouping the user's
 * personal configuration (profile, theme, chat, access tokens) in one
 * predictable place. The PAT section is only shown to PM/HR/ADMIN.
 */
export function SettingsPage() {
    const { profile } = useAuth();
    const canManagePats =
        profile !== null && PAT_ALLOWED_GROUPS.has(profile.permissionGroup);

    const sections = canManagePats
        ? SECTIONS
        : SECTIONS.filter((s) => s.id !== 'tokens');

    return (
        <div className="h-full min-h-screen w-full bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-content py-6">
                    <div className="max-w-4xl">
                        <PageHeader
                            icon={Settings}
                            title="Settings"
                            subtitle="Manage your profile, appearance and access tokens in one place."
                        />
                    </div>
                </div>
            </header>

            <main className="app-page-content py-6 md:py-8">
                <div className="mx-auto max-w-4xl">
                    <nav aria-label="Settings sections" className="mb-8 flex gap-2 overflow-x-auto pb-1">
                        {sections.map(({ id, label, icon: Icon }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div className="space-y-10">
                        <SettingsSection
                            id="profile"
                            icon={User}
                            title="User Profile"
                            description="Manage your account details, avatar and password."
                        >
                            <ProfileSection />
                        </SettingsSection>

                        <SettingsSection
                            id="appearance"
                            icon={Palette}
                            title="Appearance"
                            description="Choose a light, dark, or system theme preference."
                        >
                            <AppearanceSection />
                        </SettingsSection>

                        <SettingsSection
                            id="chat"
                            icon={MessageSquare}
                            title="Chat"
                            description="How the assistant shows progress while generating an answer."
                        >
                            <ChatSection />
                        </SettingsSection>

                        {canManagePats && (
                            <SettingsSection
                                id="tokens"
                                icon={Key}
                                title="Access Tokens"
                                description="GitHub Personal Access Tokens used for repository ingestion."
                            >
                                <TokensSection />
                            </SettingsSection>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
