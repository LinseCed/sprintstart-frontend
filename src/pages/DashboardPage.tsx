import { ChartColumn } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";

/**
 * Central hub displayed after login.
 * Shows high-level project status and provides quick actions for the user.
 */
export function DashboardPage() {
    return (
        <div className="min-h-screen bg-app-bg py-6 lg:py-8">
            <div className="app-page-frame">
                <PageHeader
                    icon={ChartColumn}
                    title="Dashboard"
                    subtitle="Your central workspace for project status, onboarding progress and next actions."
                />
            </div>
        </div>
    );
}
