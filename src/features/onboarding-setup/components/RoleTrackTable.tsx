import { AlertCircle, Loader2, Route } from 'lucide-react';
import type { OnboardingTrack, ProjectRoleWithTrack } from '../types';
import type { UseRoleTracksResult } from '../hooks/useRoleTracks';

const UNSET = '__unset__';

/**
 * Which onboarding track each project role puts its people on. A track decides, per role, what
 * counts as that person's work and what to call it.
 *
 * Two things this surface is deliberate about. It names the **consequence** of a track that admits
 * no evidence, next to the choice rather than in a doc, because assigning one silently means that
 * hire's progress can never be measured. And ⚠️ **roles are global, not per project**, so the copy
 * says so — the page around this is project-scoped, and letting a PM assume this control was too
 * would be a quiet lie about what their change affects.
 */
export function RoleTrackTable({
    tracks,
    roles,
    loading,
    error,
    savingRoleId,
    saveError,
    setTrack,
    canEdit,
}: UseRoleTracksResult & { canEdit: boolean }) {
    const trackByKey = new Map(tracks.map((track) => [track.key, track]));

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-2xl border border-app-border p-10">
                <Loader2 className="h-6 w-6 animate-spin text-app-brand" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                <p className="text-sm text-app-danger-text">
                    Could not load roles and tracks. Try again in a moment.
                </p>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <header className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-app-border p-2">
                    <Route className="h-4 w-4 text-app-brand" />
                </span>
                <div>
                    <h2 className="text-base font-semibold text-app-text">What onboarding means per role</h2>
                    <p className="mt-1 text-sm text-app-text-muted">
                        A track decides what counts as this role&apos;s work and what to call it. Roles are
                        shared across every project, so a change here applies everywhere.
                    </p>
                </div>
            </header>

            {saveError ? (
                <div className="flex items-center gap-3 rounded-xl border border-app-danger-border bg-app-danger-bg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                    <p className="text-sm text-app-danger-text">{saveError}</p>
                </div>
            ) : null}

            {roles.length === 0 ? (
                <p className="rounded-2xl border border-app-border p-6 text-sm text-app-text-muted">
                    No project roles exist yet. Create one in Team Management, then choose its track here.
                </p>
            ) : (
                <ul className="divide-y divide-app-border rounded-2xl border border-app-border">
                    {roles.map((role) => (
                        <RoleRow
                            key={role.id}
                            role={role}
                            tracks={tracks}
                            track={role.onboardingTrackKey ? trackByKey.get(role.onboardingTrackKey) : undefined}
                            saving={savingRoleId === role.id}
                            canEdit={canEdit}
                            onChange={(value) => void setTrack(role.id, value)}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function RoleRow({
    role,
    tracks,
    track,
    saving,
    canEdit,
    onChange,
}: {
    role: ProjectRoleWithTrack;
    tracks: OnboardingTrack[];
    track: OnboardingTrack | undefined;
    saving: boolean;
    canEdit: boolean;
    onChange: (trackKey: string | null) => void;
}) {
    const selectId = `role-track-${role.id}`;

    return (
        <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-app-text">{role.name}</p>
                <p className="mt-0.5 text-sm text-app-text-muted">
                    {track ? <TrackSummary track={track} /> : 'Not set — uses the default track.'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin text-app-brand" /> : null}
                <label className="sr-only" htmlFor={selectId}>
                    Onboarding track for {role.name}
                </label>
                <select
                    id={selectId}
                    className="rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text disabled:opacity-60"
                    value={role.onboardingTrackKey ?? UNSET}
                    disabled={!canEdit || saving}
                    onChange={(event) =>
                        onChange(event.target.value === UNSET ? null : event.target.value)
                    }
                >
                    <option value={UNSET}>Not set (default)</option>
                    {tracks.map((option) => (
                        <option key={option.key} value={option.key}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </li>
    );
}

/**
 * What choosing this track means, in one line.
 *
 * A track with no evidence kinds says so plainly. Assigning one is legitimate — it gets the
 * vocabulary right — but nothing that role does can be observed by anything connected today, so
 * their progress cannot be measured yet. A PM should meet that fact here, not weeks later when a
 * hire's ramp has never moved.
 */
function TrackSummary({ track }: { track: OnboardingTrack }) {
    if (track.evidenceKinds.length === 0) {
        return (
            <>
                <span className="font-medium text-app-text">{track.label}</span> — work is called a{' '}
                &ldquo;{track.contributionNoun}&rdquo;.{' '}
                <span className="text-app-warning-text">
                    Nothing this role does can be measured yet, so their progress will stay at zero.
                </span>
            </>
        );
    }

    return (
        <>
            <span className="font-medium text-app-text">{track.label}</span> — work is called a &ldquo;
            {track.contributionNoun}&rdquo;, and counts once {track.contributionVerbPast}.
        </>
    );
}
