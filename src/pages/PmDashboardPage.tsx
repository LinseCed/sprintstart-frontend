// features/dashboard/DashboardView.tsx

import { BriefcaseBusiness } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { IngestionStatusWidget } from "../features/data-ingestion/components/IngestionStatusWidget";
import { FaqWidget } from "../features/faq/components/FaqWidget";
import { KnowledgeGapWidget } from "../features/knowledge-gaps/components/KnowledgeGapWidget";
import { TeamManagementWidget } from "../features/team-management/components/TeamManagementWidget";

export function PmDashboardPage() {
    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={BriefcaseBusiness}
                        title="PM Dashboard"
                        subtitle="Track team onboarding, spot recurring questions and keep knowledge gaps visible."
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
                {/* Team Overview */}
                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-app-text">
                            Team overview
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            Track the current status of your team and onboarding
                            progress.
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
                            Frequently asked questions and onboarding knowledge
                            gaps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <FaqWidget />
                        <KnowledgeGapWidget />
                    </div>
                </section>

                {/* Data Ingestion Section */}
                <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-app-text">
                            Data ingestion
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            Sync health of connected sources: last run,
                            ingested/updated/failed counts and errors.
                        </p>
                    </div>

                    <IngestionStatusWidget />
                </section>
            </main>
        </div>
    );
}
