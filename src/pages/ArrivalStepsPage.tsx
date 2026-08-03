import { useState } from 'react';
import { PlaneLanding } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ArrivalStepAuthoring } from '../features/arrival/components/ArrivalStepAuthoring';
import { useProjectContext } from '../features/projects/useProjectContext';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';

/** The company-wide scope, as a tab value. Null is the scope; this is only how a tab spells it. */
const COMPANY = '__company__';

/**
 * Authoring the arrival list: what a new joiner needs before they can work.
 *
 * ### Company-wide first, per project second — and that order is the argument
 *
 * Account creation, VPN and HR paperwork are the same for every project, and making each PM
 * re-author them is exactly the *"erheblich mehr Effort"* the tutor warned about for starter tasks.
 * So the company list is the default tab and the common case; a project tab is for what that
 * project needs **on top**, and a hire's own list is the union of the two.
 *
 * A project step that reuses a company step's key replaces its wording rather than adding a second
 * row — the key is what state is stored against, so a project can sharpen a sentence without
 * costing anybody their record of having done it.
 *
 * HR reads but does not write, matching the backend and every other authoring surface here. Worth
 * revisiting: a good deal of this content — paperwork, badges, accounts — is HR's to own rather
 * than a PM's.
 */
export function ArrivalStepsPage() {
    const { profile } = useAuth();
    const { projects } = useProjectContext();
    const [scope, setScope] = useState<string>(COMPANY);

    const canAuthor =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;

    const selected = projects.find((project) => project.id === scope) ?? null;

    return (
        <div className="space-y-6">
            <PageHeader
                icon={PlaneLanding}
                title="Arrival"
                subtitle="What somebody needs before they can start. Shown on every new joiner's board and raised by their buddy — never enforced."
            />

            {/*
              Rendered only when there is a second scope to switch to. A lone "Everyone" tab on an
              installation with no projects is a control that cannot do anything.
            */}
            {projects.length > 0 && (
                <div
                    role="tablist"
                    aria-label="Which list to author"
                    className="flex flex-wrap gap-2 border-b border-app-border pb-2"
                >
                    <ScopeTab
                        label="Everyone"
                        selected={scope === COMPANY}
                        onSelect={() => setScope(COMPANY)}
                    />
                    {projects.map((project) => (
                        <ScopeTab
                            key={project.id}
                            label={project.name}
                            selected={scope === project.id}
                            onSelect={() => setScope(project.id)}
                        />
                    ))}
                </div>
            )}

            {/*
              HR reads the real list rather than a notice standing in for it: they are often the
              person who knows what it should say, and the backend already serves them the read.
            */}
            <ArrivalStepAuthoring
                // Remounted on a scope change rather than reusing state: an "add a step" form left
                // open in one scope would otherwise still be open, and submit, into the next.
                key={scope}
                readOnly={!canAuthor}
                projectId={selected?.id ?? null}
                projectName={selected?.name ?? null}
            />
        </div>
    );
}

function ScopeTab({
    label,
    selected,
    onSelect,
}: {
    label: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={onSelect}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
                selected
                    ? 'bg-app-surface-muted font-medium text-app-text'
                    : 'text-app-text-muted hover:bg-app-surface-muted hover:text-app-text'
            }`}
        >
            {label}
        </button>
    );
}
