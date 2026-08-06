import { apiClient } from './apiClient';
import type {
    CompetencyModule,
    CompetencyModules,
    ModulePage,
    ModulePageKind,
    ModuleStatus
} from '../features/competency-module/types';
import type { VerificationEndpoint, VerificationType } from '../features/learn-verify/types';

const PM_URL = '/api/v1/onboarding/competency-modules';

/**
 * The module-authoring contract. Authoring only -- a module's teaching reaches a hire through
 * the buddy, not through a page they navigate to, so there are no `/me/modules/...` reads here.
 */
export const competencyModuleService = {
    async list(projectId: string, status: ModuleStatus): Promise<CompetencyModules> {
        const params = new URLSearchParams({ projectId, status });
        return await apiClient.fetch<CompetencyModules>(`${PM_URL}?${params.toString()}`);
    },

    async get(moduleId: string): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(`${PM_URL}/${moduleId}`);
    },

    /**
     * Starts a new version. `copyFromActive` seeds it with what is currently
     * live, so editing a published module starts from the published text rather
     * than a blank page.
     */
    async createVersion(input: {
        competencyKey: string;
        projectId: string;
        title: string;
        summary?: string;
        copyFromActive?: boolean;
    }): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(PM_URL, {
            method: 'POST',
            body: JSON.stringify(input)
        });
    },

    /** Asks the AI to draft this competency's module from the project's corpus. */
    async proposeFromCorpus(competencyKey: string, projectId: string): Promise<CompetencyModule | null> {
        const params = new URLSearchParams({ competencyKey, projectId });
        return await apiClient.fetch<CompetencyModule | null>(`${PM_URL}/propose?${params.toString()}`, {
            method: 'POST'
        });
    },

    async update(moduleId: string, input: { title?: string; summary?: string }): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(`${PM_URL}/${moduleId}`, {
            method: 'PATCH',
            body: JSON.stringify(input)
        });
    },

    async addPage(
        moduleId: string,
        input: { kind: ModulePageKind; title: string; body?: string; position?: number }
    ): Promise<ModulePage> {
        return await apiClient.fetch<ModulePage>(`${PM_URL}/${moduleId}/pages`, {
            method: 'POST',
            body: JSON.stringify(input)
        });
    },

    async updatePage(
        pageId: string,
        input: { kind?: ModulePageKind; title?: string; body?: string }
    ): Promise<ModulePage> {
        return await apiClient.fetch<ModulePage>(`${PM_URL}/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify(input)
        });
    },

    async deletePage(pageId: string): Promise<void> {
        await apiClient.fetch(`${PM_URL}/pages/${pageId}`, { method: 'DELETE' });
    },

    /**
     * Applies a complete new page order in **one** call.
     *
     * Not a sequence of per-page moves: the intermediate states of such a
     * sequence are not valid orderings, and a client that fails halfway leaves
     * the module scrambled for everyone reading it.
     */
    async reorderPages(moduleId: string, pageIds: string[]): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(`${PM_URL}/${moduleId}/pages/order`, {
            method: 'PUT',
            body: JSON.stringify({ pageIds })
        });
    },

    /** Publishes this version: what every hire on the node sees changes here. */
    async approve(moduleId: string): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(`${PM_URL}/${moduleId}/approve`, {
            method: 'POST'
        });
    },

    async reject(moduleId: string, reason?: string): Promise<CompetencyModule> {
        return await apiClient.fetch<CompetencyModule>(`${PM_URL}/${moduleId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? null })
        });
    },

    /** Creates or replaces the module's gating check. */
    async upsertVerification(
        moduleId: string,
        input: {
            type: VerificationType;
            prompt: string;
            rubric?: string | null;
            canonicalAnswer?: string | null;
            repositoryConnectionId?: string | null;
            competencyKey: string;
            level: string;
        }
    ): Promise<VerificationEndpoint> {
        return await apiClient.fetch<VerificationEndpoint>(`${PM_URL}/${moduleId}/verification`, {
            method: 'PUT',
            body: JSON.stringify(input)
        });
    }
};
