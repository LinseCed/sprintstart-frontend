import { apiClient } from './apiClient';
import type { MyCompetency } from '../features/my-path/types';

export const myCompetencyService = {
    /**
     * Returns the authenticated user's full durable competency ledger: every
     * competency they hold, with its level and how it was established
     * (`ASSESSED` / `VERIFIED` / `DECLARED`).
     *
     * The self-serve counterpart of the PM-facing competency dashboard. The
     * ledger is global rather than per-project, so this takes no `projectId`:
     * what a user proved on one project counts on all of them.
     *
     * @returns The ledger rows; an empty array when the user has no ledger yet
     * (e.g. before their skill assessment) -- not an error.
     */
    async fetchMyCompetencies(): Promise<MyCompetency[]> {
        return await apiClient.fetch<MyCompetency[]>('/api/v1/onboarding/me/competencies');
    }
};
