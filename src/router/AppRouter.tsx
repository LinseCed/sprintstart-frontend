import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useProjectContext } from '../features/projects/useProjectContext';
import { canAccessRoute, getDefaultRoute, type AppRoute } from '../auth/accessPolicy';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage.tsx';
import { DataIngestionPage } from '../pages/DataIngestionPage.tsx';
import { OnboardingSetupPage } from '../pages/OnboardingSetupPage.tsx';
import { ReviewInboxPage } from '../pages/ReviewInboxPage.tsx';
import { ArrivalStepsPage } from '../pages/ArrivalStepsPage';
import { GraphStudioPage } from '../pages/GraphStudioPage.tsx';
import { StarterWorkPage } from '../pages/StarterWorkPage';
import { BuddyPage } from '../pages/BuddyPage';
import { LoginPage } from '../pages/LoginPage';
import { AuthGuard } from './AuthGuard';
import { TeamManagementPage } from '../pages/TeamManagementPage.tsx';
import { TeamMemberDetailPage } from '../pages/TeamMemberDetailPage.tsx';
import { PmDashboardPage } from '../pages/PmDashboardPage.tsx';
import { AdminPage } from '../pages/AdminPage.tsx';
import { SettingsPage } from '../pages/SettingsPage.tsx';
import { FaqPage } from '../features/faq/components/FaqPage.tsx';
import { FaqDetailPage } from '../features/faq/components/FaqDetailPage.tsx';
import { KnowledgeGapsPage } from '../features/knowledge-gaps/components/KnowledgeGapsPage.tsx';
import { KnowledgeGapsDetailPage } from '../features/knowledge-gaps/components/KnowledgeGapsDetailPage.tsx';
import { KnowledgeRequestInboxPage } from '../features/knowledge-request/components/KnowledgeRequestInboxPage.tsx';
import { CompetencyDashboardPage } from '../features/competency-dashboard/components/CompetencyDashboardPage.tsx';
import { OnboardingMetricsPage } from '../features/onboarding-metrics/components/OnboardingMetricsPage.tsx';
import { ModuleEditorPage } from '../pages/ModuleEditorPage.tsx';
import { BoardPage } from '../pages/BoardPage.tsx';
import { NotFoundPage } from '../pages/NotFoundPage.tsx';

/**
 * Blocks direct navigation to a manager-scoped route when the user may not
 * access it — most notably a PM who only has member access to the selected
 * project reaching `/pm-dashboard` or `/data-ingestion` by URL, which the
 * sidebar merely hides. Waits for the project context to load before deciding
 * so a managing PM is never bounced on the transient empty state during initial
 * load.
 */
function ManagerAreaGuard({
    route,
    children,
}: {
    route: AppRoute;
    children: ReactNode;
}) {
    const { profile } = useAuth();
    const { canManageSelected, isLoading } = useProjectContext();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-app-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
            </div>
        );
    }

    if (!canAccessRoute(profile, route, canManageSelected)) {
        return <Navigate to={getDefaultRoute(profile)} replace />;
    }

    return <>{children}</>;
}

export function AppRouter() {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                {/* Retired hire surfaces: onboarding is one conversation now, so the phased
                    journey, First Week, the competency map, and the standalone assessment page
                    all resolve to the buddy (which enters intake mode for a hire with no
                    placement). Keeping the routes as redirects means old links land somewhere
                    real. */}
                <Route path="/onboarding" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/path" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/assessment" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/:stepId" element={<Navigate to="/buddy" replace />} />
                <Route path="/buddy" element={<BuddyPage />} />
                {/* The board is the durable half of the buddy: the conversation opens fresh each
                    visit, so what the mentor wants to keep in front of you lives here. */}
                <Route path="/board" element={<BoardPage />} />
                <Route path="/first-week" element={<Navigate to="/buddy" replace />} />
                <Route path="/my-path" element={<Navigate to="/buddy" replace />} />
                <Route path="/my-path/module/:moduleId" element={<Navigate to="/buddy" replace />} />
                <Route path="/competency-modules/:moduleId" element={<ModuleEditorPage />} />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route
                    path="/data-ingestion"
                    element={
                        <ManagerAreaGuard route="/data-ingestion">
                            <DataIngestionPage />
                        </ManagerAreaGuard>
                    }
                />
                <Route path="/setup" element={<OnboardingSetupPage />} />
                <Route path="/setup/review" element={<ReviewInboxPage />} />
                <Route path="/graph-studio" element={<GraphStudioPage />} />
                <Route path="/arrival-steps" element={<ArrivalStepsPage />} />
                {/* The proposal queue used to live here on its own; it is part of the studio now. */}
                <Route path="/graph-authoring" element={<Navigate to="/graph-studio" replace />} />
                <Route path="/starter-work" element={<StarterWorkPage />} />
                <Route path="/team-management" element={<TeamManagementPage />} />
                <Route path="/team/:userId" element={<TeamMemberDetailPage />} />
                <Route
                    path="/pm-dashboard"
                    element={
                        <ManagerAreaGuard route="/pm-dashboard">
                            <PmDashboardPage />
                        </ManagerAreaGuard>
                    }
                />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/insights/faq" element={<FaqPage />} />
                <Route path="/insights/faq/:groupId" element={<FaqDetailPage />} />
                <Route path="/insights/knowledge-gaps" element={<KnowledgeGapsPage />} />
                <Route path="/insights/knowledge-gaps/:gapId" element={<KnowledgeGapsDetailPage />} />
                <Route
                    path="/insights/knowledge-requests"
                    element={<KnowledgeRequestInboxPage />}
                />
                <Route path="/insights/competencies" element={<CompetencyDashboardPage />} />
                <Route path="/insights/onboarding" element={<OnboardingMetricsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AuthGuard>
    );
}