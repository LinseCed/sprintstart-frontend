import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage.tsx';
import { DataIngestionPage } from '../pages/DataIngestionPage.tsx';
import { GraphAuthoringPage } from '../pages/GraphAuthoringPage.tsx';
import { BlueprintAuthoringPage } from '../pages/BlueprintAuthoringPage.tsx';
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
import { ModuleEditorPage } from '../pages/ModuleEditorPage.tsx';

/**
 * Sends an old per-step journey link to the module that replaced it.
 *
 * `<Navigate>` cannot interpolate a route param, so the redirect needs a component.
 */
function StepRedirect() {
    const { stepId } = useParams<{ stepId: string }>();
    return <Navigate to={`/my-path/module/${stepId ?? ''}`} replace />;
}

export function AppRouter() {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/onboarding/assessment" element={<SkillAssessmentPage />} />
                {/* The phased journey is retired: a hire's path is the competency graph, and the
                    phases view had no self-serve backend left (GET /me/path returns the competency
                    PathView, and the phases payload is PM-only). These keep old links landing
                    somewhere real instead of 400ing. */}
                <Route path="/onboarding" element={<Navigate to="/my-path" replace />} />
                <Route path="/onboarding/path" element={<Navigate to="/my-path" replace />} />
                <Route path="/onboarding/:stepId" element={<StepRedirect />} />
                <Route path="/my-path" element={<MyPathPage />} />
                <Route path="/my-path/module/:moduleId" element={<MyPathModulePage />} />
                <Route path="/competency-modules/:moduleId" element={<ModuleEditorPage />} />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/data-ingestion" element={<DataIngestionPage />} />
                <Route path="/graph-authoring" element={<GraphAuthoringPage />} />
                <Route path="/onboarding-baseline" element={<BlueprintAuthoringPage />} />
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