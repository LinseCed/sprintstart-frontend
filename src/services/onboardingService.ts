import { apiClient } from './apiClient';
import type {
    OnboardingPathEndpoint,
    OnboardingStepDetail,
    OnboardingSkipEndpoint,
    OnboardingTaskEndpoint,
    OnboardingResourceEndpoint,
    StepStatus,
} from '../features/onboarding/types';
import onboardingStepMock from '../mocks/onboardingStepMock.json';

export const onboardingService = {

    // ── PATH ─────────────────────────────────────────────────

    async fetchPath(): Promise<OnboardingPathEndpoint> {
        return await apiClient.fetch<OnboardingPathEndpoint>(`/api/v1/onboarding/me/path`);
    },

    // ── STEP ─────────────────────────────────────────────────

    async fetchStep(stepId: string): Promise<OnboardingStepDetail> {
        try {
            return await apiClient.fetch<OnboardingStepDetail>(`/api/v1/onboarding/me/steps/${stepId}`);
        } catch (error) {
            console.error(`Error fetching onboarding step with ID ${stepId}:`, error);
            return onboardingStepMock as OnboardingStepDetail;
        }
    },

    /**
     * Marks a step as in progress on the backend and records its start timestamp.
     * Safe to call again on an already started step (the backend keeps the original
     * startedAt).
     */
    async startStep(stepId: string): Promise<void> {
        await apiClient.fetch(`/api/v1/onboarding/me/steps/${stepId}/start`, {
            method: 'PUT',
        });
    },

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
expectedOutcome: step.expectedOutcomes?.[0] ?? '',
                status: newStatus,
                skip: step.skip ?? null,
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

    // ── FEEDBACK ──────────────────────────────────────────────

    async submitFeedback(stepId: string, helpful: boolean, message: string): Promise<void> {
        await apiClient.fetch(`/api/v1/onboarding/me/feedback`, {
            method: 'POST',
            body: JSON.stringify({ stepId, helpful, message }),
        });
    },

    // ── TASKS ─────────────────────────────────────────────────

    async fetchTasks(stepId: string): Promise<OnboardingTaskEndpoint[]> {
        return await apiClient.fetch<OnboardingTaskEndpoint[]>(`/api/v1/onboarding/me/steps/${stepId}/tasks`);
    },

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

    async fetchResources(stepId: string): Promise<OnboardingResourceEndpoint[]> {
        return await apiClient.fetch<OnboardingResourceEndpoint[]>(`/api/v1/onboarding/me/steps/${stepId}/resources`);
    },
};
