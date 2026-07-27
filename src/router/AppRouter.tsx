import { Navigate, Route, Routes } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage.tsx';
import { DataIngestionPage } from '../pages/DataIngestionPage.tsx';
import { OnboardingSetupPage } from '../pages/OnboardingSetupPage.tsx';
import { ReviewInboxPage } from '../pages/ReviewInboxPage.tsx';
import { GraphStudioPage } from '../pages/GraphStudioPage.tsx';
import { StarterWorkPage } from '../pages/StarterWorkPage';
import { BuddyPage } from '../pages/BuddyPage';
import { LoginPage } from '../pages/LoginPage';
import { AuthGuard } from './AuthGuard';
import { TeamManagementPage } from '../pages/TeamManagementPage.tsx';
import { TeamMemberDetailPage } from '../pages/TeamMemberDetailPage.tsx';
import { PmDashboardPage } from '../pages/PmDashboardPage.tsx';
import { AdminPage } from '../pages/AdminPage.tsx';
import { FaqPage } from '../features/faq/components/FaqPage.tsx';
import { FaqDetailPage } from '../features/faq/components/FaqDetailPage.tsx';
import { KnowledgeGapsPage } from '../features/knowledge-gaps/components/KnowledgeGapsPage.tsx';
import { KnowledgeGapsDetailPage } from '../features/knowledge-gaps/components/KnowledgeGapsDetailPage.tsx';
import { KnowledgeRequestInboxPage } from '../features/knowledge-request/components/KnowledgeRequestInboxPage.tsx';
import { CompetencyDashboardPage } from '../features/competency-dashboard/components/CompetencyDashboardPage.tsx';
import { OnboardingMetricsPage } from '../features/onboarding-metrics/components/OnboardingMetricsPage.tsx';
import { ProfilePage } from '../pages/ProfilePage.tsx';
import { ModuleEditorPage } from '../pages/ModuleEditorPage.tsx';
import { BoardPage } from '../pages/BoardPage.tsx';

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
                <Route path="/data-ingestion" element={<DataIngestionPage />} />
                <Route path="/setup" element={<OnboardingSetupPage />} />
                <Route path="/setup/review" element={<ReviewInboxPage />} />
                <Route path="/graph-studio" element={<GraphStudioPage />} />
                {/* The proposal queue used to live here on its own; it is part of the studio now. */}
                <Route path="/graph-authoring" element={<Navigate to="/graph-studio" replace />} />
                <Route path="/starter-work" element={<StarterWorkPage />} />
                <Route path="/team-management" element={<TeamManagementPage />} />
                <Route path="/team/:userId" element={<TeamMemberDetailPage />} />
                <Route path="/pm-dashboard" element={<PmDashboardPage />} />
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
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </AuthGuard>
    );
}