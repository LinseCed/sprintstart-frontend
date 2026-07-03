import { ChartColumn } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";

/**
 * Central hub displayed after login.
 * Shows high-level project status and provides quick actions for the user.
 */
export function DashboardPage() {
    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={ChartColumn}
                        title="Dashboard"
                        subtitle="Your central workspace for project status, onboarding progress and next actions."
                    />
                </div>
            </header>
        </div>
    );
}
