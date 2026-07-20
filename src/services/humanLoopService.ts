import { apiClient } from './apiClient';
import type {
    AssignBuddyRequest,
    BuddyAssignment,
    LogBuddyContactRequest,
    MyBuddy,
    MyTimeline,
    ProjectAttention
} from '../features/human-loop/types';

const BASE = '/api/v1/onboarding';

export const humanLoopService = {
    /**
     * The authenticated hire's buddy on a project: who to ask, when they last
     * spoke, and whether that is overdue.
     *
     * The backend answers 204 (no body) when no buddy is assigned; `apiClient`
     * turns that into `{}`, so a missing `buddyId` is normalized to `null` —
     * "no buddy yet" is a legitimate state, not an error.
     *
     * @param projectId Onboarding is per-project, so the buddy is scoped to one.
     */
    async fetchMyBuddy(projectId: string): Promise<MyBuddy | null> {
        const response = await apiClient.fetch<MyBuddy | Record<string, never>>(
            `${BASE}/me/buddy?projectId=${encodeURIComponent(projectId)}`
        );
        return 'buddyId' in response ? (response as MyBuddy) : null;
    },

    /**
     * The authenticated hire's own onboarding timeline on a project — carries
     * `longestOpenWaitHours`, how long their pull request has been waiting.
     *
     * @param projectId The project whose timeline to read.
     * @throws ApiError 404 when the caller is not a member of the project.
     */
    async fetchMyTimeline(projectId: string): Promise<MyTimeline> {
        return await apiClient.fetch<MyTimeline>(
            `${BASE}/metrics/me?projectId=${encodeURIComponent(projectId)}`
        );
    },

    /**
     * Records that a conversation happened. Either side may log it; nothing
     * verifies it. A hire logging their own contact omits `hireId`; a buddy/PM
     * logging on a hire's behalf names them.
     *
     * @param projectId The project the pairing belongs to.
     * @param body Optional hire id (delegated logging), timestamp, and note.
     * @throws ApiError 400 for a future date, 404 when the hire is not a member.
     */
    async logContact(projectId: string, body: LogBuddyContactRequest = {}): Promise<void> {
        await apiClient.fetch<void>(
            `${BASE}/me/buddy/contacts?projectId=${encodeURIComponent(projectId)}`,
            { method: 'POST', body: JSON.stringify(body) }
        );
    },

    /**
     * Every buddy pairing on a project, for whoever runs it (PM/HR/ADMIN).
     *
     * @param projectId The project to list pairings for.
     */
    async listAssignments(projectId: string): Promise<BuddyAssignment[]> {
        return await apiClient.fetch<BuddyAssignment[]>(
            `${BASE}/projects/${encodeURIComponent(projectId)}/buddies`
        );
    },

    /**
     * Pairs a hire with a buddy (PM/ADMIN). A person cannot be their own buddy.
     *
     * @param projectId The project the pairing belongs to.
     * @param body Hire, buddy, and optional contact cadence.
     * @throws ApiError 400 for a self-assignment, 404 when either is not a member.
     */
    async assignBuddy(projectId: string, body: AssignBuddyRequest): Promise<BuddyAssignment> {
        return await apiClient.fetch<BuddyAssignment>(
            `${BASE}/projects/${encodeURIComponent(projectId)}/buddies`,
            { method: 'POST', body: JSON.stringify(body) }
        );
    },

    /**
     * Removes a buddy pairing (PM/ADMIN). Conversations already logged are kept
     * — they happened, and deleting them would rewrite the history the metrics read.
     *
     * @param projectId The project the pairing belongs to.
     * @param hireId The hire whose pairing to remove.
     */
    async unassignBuddy(projectId: string, hireId: string): Promise<void> {
        await apiClient.fetch<void>(
            `${BASE}/projects/${encodeURIComponent(projectId)}/buddies/${encodeURIComponent(hireId)}`,
            { method: 'DELETE' }
        );
    },

    /**
     * Who on a project needs a human today (PM/HR/ADMIN): blocked before
     * drifting, longest wait first, each item stating whose move it is.
     *
     * @param projectId The project to read the attention list for.
     */
    async fetchAttention(projectId: string): Promise<ProjectAttention> {
        return await apiClient.fetch<ProjectAttention>(
            `${BASE}/projects/${encodeURIComponent(projectId)}/attention`
        );
    }
};
