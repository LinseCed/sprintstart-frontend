import { Navigate, Route, Routes } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage.tsx';
import { DataIngestionPage } from '../pages/DataIngestionPage.tsx';
import { GraphAuthoringPage } from '../pages/GraphAuthoringPage.tsx';
import { OnBoardingPage } from '../pages/OnBoardingPage';
import { OnBoardingItemPage } from '../features/onboarding/components/OnBoardingItemPage';
import { SkillAssessmentPage } from '../pages/SkillAssessmentPage';
import { MyPathPage } from '../pages/MyPathPage';
import { MyPathModulePage } from '../pages/MyPathModulePage';
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
import { CompetencyDashboardPage } from '../features/competency-dashboard/components/CompetencyDashboardPage.tsx';
import { ProfilePage } from '../pages/ProfilePage.tsx';

export function AppRouter() {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/onboarding" element={<OnBoardingPage />} />
                <Route path="/onboarding/assessment" element={<SkillAssessmentPage />} />
                {/* The competency path moved out from under /onboarding to its own top-level
                    route; kept as a redirect so existing links and bookmarks still land. */}
                <Route path="/onboarding/path" element={<Navigate to="/my-path" replace />} />
                <Route path="/my-path" element={<MyPathPage />} />
                <Route path="/my-path/module/:stepId" element={<MyPathModulePage />} />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/onboarding/:stepId" element={<OnBoardingItemPage />} />
                <Route path="/data-ingestion" element={<DataIngestionPage />} />
                <Route path="/graph-authoring" element={<GraphAuthoringPage />} />
                <Route path="/team-management" element={<TeamManagementPage />} />
                <Route path="/team/:userId" element={<TeamMemberDetailPage />} />
                <Route path="/pm-dashboard" element={<PmDashboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/insights/faq" element={<FaqPage />} />
                <Route path="/insights/faq/:groupId" element={<FaqDetailPage />} />
                <Route path="/insights/knowledge-gaps" element={<KnowledgeGapsPage />} />
                <Route path="/insights/knowledge-gaps/:gapId" element={<KnowledgeGapsDetailPage />} />
                <Route path="/insights/competencies" element={<CompetencyDashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </AuthGuard>
    );
}