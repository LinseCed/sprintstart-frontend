import { PlaneLanding } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ArrivalStepAuthoring } from '../features/arrival/components/ArrivalStepAuthoring';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';

/**
 * Authoring the arrival list: what a new joiner needs before they can work.
 *
 * Company-wide only, which is both what A0 supports and the common case — account creation and
 * paperwork do not differ per project, and making each PM re-author them is the effort this model
 * exists to avoid. Per-project additions come with A3.
 *
 * HR reads but does not write, matching the backend and every other authoring surface here. Worth
 * revisiting: a good deal of this content — paperwork, badges, accounts — is HR's to own rather
 * than a PM's.
 */
export function ArrivalStepsPage() {
    const { profile } = useAuth();
    const canAuthor =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;

    return (
        <div className="space-y-6">
            <PageHeader
                icon={PlaneLanding}
                title="Arrival"
                subtitle="What somebody needs before they can start. Shown on every new joiner's board and raised by their buddy — never enforced."
            />

            {/*
              HR reads the real list rather than a notice standing in for it: they are often the
              person who knows what it should say, and the backend already serves them the read.
            */}
            <ArrivalStepAuthoring readOnly={!canAuthor} />
        </div>
    );
}
