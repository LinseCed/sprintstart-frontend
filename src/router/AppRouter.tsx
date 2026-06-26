import { Route, Routes } from 'react-router-dom';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage.tsx';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { DataIngestionPage } from '../pages/DataIngestionPage.tsx';
import { OnBoardingPage } from '../pages/OnBoardingPage';
import { OnBoardingItemPage } from '../features/onboarding/components/OnBoardingItemPage';
import { LoginPage } from '../pages/LoginPage';
import { AuthGuard } from './AuthGuard';
import { SelectionWizardPage } from '../pages/SelectionWizardPage';
import { SkillWizardPage } from '../pages/SkillWizardPage';
import { TeamManagementPage } from '../pages/pm-view/TeamManagementPage.tsx';
import { TeamMemberDetailPage } from '../pages/pm-view/TeamMemberDetailPage.tsx';
import { PmDashboardPage } from '../pages/PmDashboardPage.tsx';
import { FaqPage } from '../features/faq/components/FaqPage.tsx';
import { FaqDetailPage } from '../features/faq/components/faqDetailView.tsx';
import { KnowledgeGapsPage } from '../features/knowledge-gaps/components/KnowledgeGapsPage.tsx';
import { KnowledgeGapsDetailPage } from '../features/knowledge-gaps/components/knowledgeGapsDetailPage.tsx';

export function AppRouter() {
    return (
        <AuthGuard>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/selection-wizard" element={<SelectionWizardPage />} />
                <Route path="/skill-wizard" element={<SkillWizardPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/onboarding" element={<OnBoardingPage />} />
                <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="/onboarding/:stepId" element={<OnBoardingItemPage />} />
                <Route path="/data-ingestion" element={<DataIngestionPage />} />
                <Route path="/team-management" element={<TeamManagementPage />} />
                <Route path="/team/:userId" element={<TeamMemberDetailPage />} />
                <Route path="/pm-dashboard" element={<PmDashboardPage />} />
                <Route path="/insights/faq" element={<FaqPage />} />
                <Route path="/insights/faq/:groupId" element={<FaqDetailPage />} />
                <Route path="/insights/knowledge-gaps" element={<KnowledgeGapsPage />} />
                <Route path="/insights/knowledge-gaps/:gapId" element={<KnowledgeGapsDetailPage />} />
            </Routes>
        </AuthGuard>
    );
}