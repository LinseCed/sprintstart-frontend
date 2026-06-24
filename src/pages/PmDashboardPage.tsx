// features/dashboard/DashboardView.tsx

import { FaqWidget } from "../features/faq/components/FaqWidget";
import { KnowledgeGapWidget } from "../features/knowledge-gaps/components/KnowledgeGapWidget";
import { TeamManagementWidget } from "../features/team-management/components/TeamManagementWidget";

export function PmDashboardPage() {
    return (
        <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6">
                    <FaqWidget />
                </div>
            </div>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6">
                    <KnowledgeGapWidget />
                </div>
            </div>
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6">
                    <TeamManagementWidget />
                </div>
            </div>
        </div>
    );
}