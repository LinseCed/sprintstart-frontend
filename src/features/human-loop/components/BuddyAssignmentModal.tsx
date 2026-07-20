import { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { humanLoopService } from '../../../services/humanLoopService';
import { getTeamOverview } from '../../../services/teamManagementService';
import type { TeamOverviewUser } from '../../team-management/types';
import type { BuddyAssignment } from '../types';
import { formatDaysAgo } from '../format';

type BuddyAssignmentModalProps = {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    /** Called after any change so the attention list can refresh. */
    onChanged?: () => void;
};

function memberName(member: TeamOverviewUser): string {
    return `${member.firstname} ${member.lastname}`.trim() || member.userId;
}

/**
 * PM/ADMIN surface for pairing hires with buddies on a project: the current
 * pairings (with unassign) and a form to add one.
 *
 * A person cannot be their own buddy (the backend rejects it), so the buddy
 * select excludes the chosen hire. Unassigning keeps logged contacts — the
 * conversations happened — so it is a quiet action, not a destructive one.
 */
export function BuddyAssignmentModal({ isOpen, projectId, onClose, onChanged }: BuddyAssignmentModalProps) {
    const [assignments, setAssignments] = useState<BuddyAssignment[]>([]);
    const [members, setMembers] = useState<TeamOverviewUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [hireId, setHireId] = useState('');
    const [buddyId, setBuddyId] = useState('');
    const [cadence, setCadence] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [busyHireId, setBusyHireId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !projectId) return;
        let cancelled = false;
        void (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [assignmentList, memberList] = await Promise.all([
                    humanLoopService.listAssignments(projectId),
                    getTeamOverview(undefined, undefined, [projectId])
                ]);
                if (cancelled) return;
                setAssignments(assignmentList);
                setMembers(memberList);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Could not load buddies.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isOpen, projectId]);

    const refresh = async () => {
        setAssignments(await humanLoopService.listAssignments(projectId));
        onChanged?.();
    };

    // A hire cannot buddy themselves, so the buddy list drops the selected hire.
    const buddyOptions = useMemo(
        () => members.filter(member => member.userId !== hireId),
        [members, hireId]
    );

    const handleAssign = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!hireId || !buddyId) return;
        setIsSaving(true);
        setError(null);
        try {
            const parsedCadence = cadence.trim() ? Number(cadence) : undefined;
            await humanLoopService.assignBuddy(projectId, {
                hireId,
                buddyId,
                cadenceTargetDays:
                    parsedCadence !== undefined && Number.isFinite(parsedCadence)
                        ? parsedCadence
                        : undefined
            });
            setHireId('');
            setBuddyId('');
            setCadence('');
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not assign the buddy.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnassign = async (targetHireId: string) => {
        setBusyHireId(targetHireId);
        setError(null);
        try {
            await humanLoopService.unassignBuddy(projectId, targetHireId);
            await refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not remove the pairing.');
        } finally {
            setBusyHireId(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Buddies"
            description="Pair each hire with a peer they can ask. Contact frequency is what tracks with onboarding outcomes, so set a cadence you can keep."
            size="lg"
            onClose={onClose}
        >
            <div className="space-y-6">
                {error && (
                    <p className="rounded-xl bg-app-danger-bg px-3 py-2 text-sm text-app-danger-text">
                        {error}
                    </p>
                )}

                <form
                    onSubmit={event => void handleAssign(event)}
                    className="grid grid-cols-1 gap-3 rounded-2xl border border-app-border bg-app-surface p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
                >
                    <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
                        Hire
                        <select
                            value={hireId}
                            onChange={event => setHireId(event.target.value)}
                            required
                            className="h-10 rounded-xl border border-app-border bg-app-bg px-3 text-sm text-app-text focus:border-app-brand-border-strong focus:outline-none focus:ring-2 focus:ring-app-brand-glow"
                        >
                            <option value="">Select…</option>
                            {members.map(member => (
                                <option key={member.userId} value={member.userId}>
                                    {memberName(member)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
                        Buddy
                        <select
                            value={buddyId}
                            onChange={event => setBuddyId(event.target.value)}
                            required
                            className="h-10 rounded-xl border border-app-border bg-app-bg px-3 text-sm text-app-text focus:border-app-brand-border-strong focus:outline-none focus:ring-2 focus:ring-app-brand-glow"
                        >
                            <option value="">Select…</option>
                            {buddyOptions.map(member => (
                                <option key={member.userId} value={member.userId}>
                                    {memberName(member)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
                        Every (days)
                        <input
                            type="number"
                            min={1}
                            value={cadence}
                            onChange={event => setCadence(event.target.value)}
                            placeholder="default"
                            className="h-10 w-24 rounded-xl border border-app-border bg-app-bg px-3 text-sm text-app-text focus:border-app-brand-border-strong focus:outline-none focus:ring-2 focus:ring-app-brand-glow"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={isSaving || !hireId || !buddyId}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-app-brand px-4 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <UserPlus className="h-4 w-4" aria-hidden="true" />
                        )}
                        Pair
                    </button>
                </form>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-app-brand" aria-hidden="true" />
                    </div>
                ) : assignments.length === 0 ? (
                    <p className="py-4 text-center text-sm text-app-text-muted">
                        No pairings yet on this project.
                    </p>
                ) : (
                    <ul className="divide-y divide-app-border">
                        {assignments.map(assignment => (
                            <li
                                key={assignment.hireId}
                                className="flex items-center justify-between gap-3 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm text-app-text">
                                        <span className="font-medium">{assignment.hireName}</span>{' '}
                                        <span className="text-app-text-muted">← asks →</span>{' '}
                                        <span className="font-medium">{assignment.buddyName}</span>
                                    </p>
                                    <p className="text-xs text-app-text-muted">
                                        {assignment.contactCount > 0
                                            ? `${assignment.contactCount} conversation${
                                                  assignment.contactCount === 1 ? '' : 's'
                                              } · last ${formatDaysAgo(
                                                  daysSince(assignment.lastContactAt)
                                              )}`
                                            : 'No conversations logged yet'}{' '}
                                        · every {assignment.cadenceTargetDays} days
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleUnassign(assignment.hireId)}
                                    disabled={busyHireId === assignment.hireId}
                                    aria-label={`Remove ${assignment.hireName}'s buddy`}
                                    className="shrink-0 rounded-lg p-2 text-app-text-muted transition-colors hover:bg-app-danger-bg hover:text-app-danger-text disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    {busyHireId === assignment.hireId ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}

/** Whole days between a timestamp and now; 0 when null. */
function daysSince(iso: string | null): number {
    if (!iso) return 0;
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
