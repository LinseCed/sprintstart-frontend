import { apiClient } from './apiClient';
import type { MyOrientation } from '../features/orientation/types';

const BASE = '/api/v1/onboarding';

export const orientationService = {
    /**
     * Orientation for the authenticated hire's current task on a project.
     *
     * Having no task, and having a task the corpus cannot ground a packet for,
     * are both ordinary responses rather than errors — the caller renders which
     * one it got and never fills the gap with placeholder content. Reading this
     * is not a prerequisite for starting the task and never assigns one.
     *
     * @param projectId The project to read orientation for.
     * @throws ApiError 404 when the caller is not a member of the project.
     */
    async fetchMyOrientation(projectId: string): Promise<MyOrientation> {
        return await apiClient.fetch<MyOrientation>(
            `${BASE}/me/orientation?projectId=${encodeURIComponent(projectId)}`
        );
    },

    /**
     * Reports that a piece of assembled orientation is wrong or out of date.
     *
     * Sent as page-less onboarding feedback (`pageId` is null): a packet is
     * disposable and regenerates, so there is no durable page to attach this to
     * — what is worth recording is *which source* misled somebody, which the
     * message names.
     *
     * **Known gap, deliberately not worked around here:** the only read surface
     * for this is `/api/v1/admin/onboarding/feedback`, which is ADMIN-only and
     * has no UI. The signal is captured and durable, but a PM cannot see it yet.
     *
     * @param message What was wrong, including the task and section it was on.
     */
    async reportStaleOrientation(message: string): Promise<void> {
        await apiClient.fetch<void>(`${BASE}/me/feedback`, {
            method: 'POST',
            body: JSON.stringify({ pageId: null, helpful: false, message })
        });
    }
};
