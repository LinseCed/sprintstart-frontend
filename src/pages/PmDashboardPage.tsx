// features/dashboard/DashboardView.tsx

import { BriefcaseBusiness } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { FaqWidget } from "../features/faq/components/FaqWidget";
import { KnowledgeGapWidget } from "../features/knowledge-gaps/components/KnowledgeGapWidget";
import { TeamManagementWidget } from "../features/team-management/components/TeamManagementWidget";

export function PmDashboardPage() {
    return (
        <div className="bg-app-bg py-6 lg:py-8">
            <div className="app-page-frame space-y-5">
                <PageHeader
                    icon={BriefcaseBusiness}
                    title="PM Dashboard"
                    subtitle="Track team onboarding, spot recurring questions and keep knowledge gaps visible."
                />

                {/* Team Overview */}
                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-app-text">
                            Team overview
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            Track the current status of your team and onboarding progress.
                        </p>
                    </div>

                    <TeamManagementWidget />
                </section>

                {/* Insights Section */}
                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-app-text">
                            Insights
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            Frequently asked questions and onboarding knowledge gaps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <FaqWidget />
                        <KnowledgeGapWidget />
                    </div>
                </section>
            </div>
        </div>
    );
}
