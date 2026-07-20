import { apiClient } from './apiClient';

/**
 * What the backend has inferred from a user's existing work in their projects'
 * connected repositories, as returned by `GET /me/github-history`.
 *
 * `signals` are counted, namespaced buckets (`repo:owner/name`,
 * `type:PULL_REQUEST`, `label:bug`) -- deliberately never the content of the
 * work itself. This is the complete record held about the user, which is what
 * makes consenting inspectable rather than a black box.
 */
export type GithubHistoryPrior = {
    consented: boolean;
    signals: Record<string, number>;
    computedAt: string | null;
};

export const githubHistoryService = {
    /**
     * Returns what has been inferred about the authenticated user.
     *
     * @returns The prior; `consented: false` with no signals when they have not
     * opted in -- an expected state, not an error.
     */
    async fetchPrior(): Promise<GithubHistoryPrior> {
        return await apiClient.fetch<GithubHistoryPrior>('/api/v1/onboarding/me/github-history');
    },

    /**
     * Opts in to using the user's existing repository work to calibrate their
     * skill assessment. The backend derives the prior immediately, so the
     * response already contains what was inferred.
     */
    async grantConsent(): Promise<GithubHistoryPrior> {
        return await apiClient.fetch<GithubHistoryPrior>(
            '/api/v1/onboarding/me/github-history/consent',
            { method: 'POST' }
        );
    },

    /**
     * Withdraws consent and deletes the derived prior server-side. An
     * assessment placement already made from it is deliberately kept.
     */
    async revokeConsent(): Promise<void> {
        await apiClient.fetch('/api/v1/onboarding/me/github-history/consent', {
            method: 'DELETE'
        });
    }
};
