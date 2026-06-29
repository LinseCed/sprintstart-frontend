import { apiClient } from './apiClient';
import type {
    OnboardingPathEndpoint,
    OnboardingStepDetail,
    OnboardingSkipEndpoint,
    OnboardingTaskEndpoint,
    OnboardingResourceEndpoint,
    StepStatus,
} from '../features/onboarding/types';

/**
 * Service responsible for managing onboarding paths, steps, and associated tasks.
 * Interacts with the backend onboarding module.
 */
export const onboardingService = {

    // ── PATH ─────────────────────────────────────────────────

    /**
     * Fetches the personalized onboarding path for the current authenticated user from the backend.
     */
    async fetchPath(): Promise<OnboardingPathEndpoint> {
        return await apiClient.fetch<OnboardingPathEndpoint>(`/api/v1/onboarding/me/path`);
    },

    // ── STEP ─────────────────────────────────────────────────

    /**
     * Retrieves detailed information for a specific onboarding step from the backend.
     */
    async fetchStep(stepId: string): Promise<OnboardingStepDetail> {
        return await apiClient.fetch<OnboardingStepDetail>(`/api/v1/onboarding/me/steps/${stepId}`);
    },

    /**
     * Updates the completion status of a specific onboarding step on the backend.
     */
    async updateStepStatus(step: OnboardingStepDetail, newStatus: StepStatus): Promise<void> {
        if (newStatus === 'FINISHED') {
            await apiClient.fetch(`/api/v1/onboarding/me/steps/${step.id}/complete`, {
                method: 'PUT',
            });
            return;
        }

        await apiClient.fetch(`/api/v1/onboarding/me/steps/${step.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                position: step.position,
                title: step.title,
                description: step.description,
                type: step.type ?? 'TASK',
                estimatedMinutes: step.estimatedMinutes,
                expectedOutcome: step.expectedOutcome ?? '',
            }),
        });
    },

    /**
     * Marks an onboarding step as skipped with a provided reason on the backend.
     */
    async skipStep(step: OnboardingStepDetail, reason: string): Promise<OnboardingSkipEndpoint> {
        return await apiClient.fetch<OnboardingSkipEndpoint>(`/api/v1/onboarding/me/steps/${step.id}/skips`, {
            method: 'POST',
            body: JSON.stringify({
                reason,
            }),
        });
    },

    // ── TASKS ─────────────────────────────────────────────────

    /**
     * Fetches all individual tasks associated with a specific onboarding step from the backend.
     */
    async fetchTasks(stepId: string): Promise<OnboardingTaskEndpoint[]> {
        return await apiClient.fetch<OnboardingTaskEndpoint[]>(`/api/v1/onboarding/me/steps/${stepId}/tasks`);
    },

    /**
     * Updates the completion state of a specific task within a step on the backend.
     */
    async updateTask(task: OnboardingTaskEndpoint, finished: boolean): Promise<void> {
        await apiClient.fetch(`/api/v1/onboarding/me/tasks/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                position: task.position,
                title: task.title,
                description: task.description,
                finished,
            }),
        });
    },

    // ── RESOURCES ─────────────────────────────────────────────

    /**
     * Fetches all educational or technical resources linked to a specific step from the backend.
     */
    async fetchResources(stepId: string): Promise<OnboardingResourceEndpoint[]> {
        return await apiClient.fetch<OnboardingResourceEndpoint[]>(`/api/v1/onboarding/me/steps/${stepId}/resources`);
    },
};
