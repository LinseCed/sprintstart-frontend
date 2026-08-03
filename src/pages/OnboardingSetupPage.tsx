import { AlertCircle, ListChecks, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useProjectContext } from '../features/projects/useProjectContext';
import { SetupReadinessLadder } from '../features/onboarding-setup/components/SetupReadinessLadder';
import { useSetupReadiness } from '../features/onboarding-setup/hooks/useSetupReadiness';
import { RoleTrackTable } from '../features/onboarding-setup/components/RoleTrackTable';
import { useRoleTracks } from '../features/onboarding-setup/hooks/useRoleTracks';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';

/**
 * Onboarding Setup: what this project has, in one place.
 *
 * The setup surfaces (skill map, starter tasks, buddies) grew as separate, co-equal nav items that
 * did not know about each other — so a PM could generate a competency map, never approve it, and
 * find a page "empty" with nothing explaining why. This page composes them into one readout.
 *
 * ⚠️ **It is no longer a pipeline a PM walks.** Approval is gone from every stage it existed in:
 * competencies are generated live and corrected, mined tasks are claimable the moment they land,
 * and the baseline was deleted outright. Connecting a repository is the only step left, so the
 * ladder reports outcomes rather than issuing chores — see `SetupReadinessLadder`.
 */
export function OnboardingSetupPage() {
    const { profile } = useAuth();
    const { selectedProjectId } = useProjectContext();

    const { ladder, loading, error } = useSetupReadiness(selectedProjectId);

    // Roles are global, so this loads regardless of the selected project -- see RoleTrackTable for
    // why that is stated in the copy rather than hidden behind the project picker.
    const roleTracks = useRoleTracks();
    const canEditTracks =
        profile?.permissionGroup === PermissionGroup.ADMIN ||
        profile?.permissionGroup === PermissionGroup.PM;

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={ListChecks}
                        title="Onboarding Setup"
                        subtitle="What this project has for somebody arriving into it — a corpus, a vocabulary, work they can claim — and what has not been built yet. Nothing here holds anyone up."
                    />
                </div>
            </header>

            <main className="app-page-frame py-6 lg:py-8">
                {!selectedProjectId ? (
                    <EmptyPrompt
                        title="Pick a project"
                        body="Choose a project in the sidebar switcher to see what it has for somebody arriving into it."
                    />
                ) : loading ? (
                    <div className="flex items-center justify-center p-16">
                        <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                    </div>
                ) : error || !ladder ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4">
                        <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                        <p className="text-sm text-app-danger-text">
                            Could not load setup readiness for this project. Try again in a moment.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <SetupReadinessLadder ladder={ladder} />
                        <RoleTrackTable {...roleTracks} canEdit={canEditTracks} />
                    </div>
                )}
            </main>
        </div>
    );
}

function EmptyPrompt({ title, body }: { title: string; body: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-app-border bg-app-bg p-16 text-center">
            <ListChecks className="mb-4 h-10 w-10 text-app-text-disabled" />
            <h2 className="mb-2 text-xl font-semibold text-app-text">{title}</h2>
            <p className="max-w-md text-sm text-app-text-muted">{body}</p>
        </div>
    );
}
