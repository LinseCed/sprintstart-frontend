import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Artifact } from '../../../src/features/knowledge-base/types';

vi.mock('../../../src/config/keycloak', () => ({
    default: {
        authenticated: true,
        token: 'fake-token',
        updateToken: vi.fn().mockResolvedValue(true),
        login: vi.fn(),
    }
}));

const mockFetch = vi.fn<(endpoint: string) => Promise<unknown>>();
const mockGetProfile = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: (endpoint: string) => mockFetch(endpoint),
    }
}));

vi.mock('../../../src/services/userService', () => ({
    userService: {
        getProfile: () => mockGetProfile(),
    }
}));

const projectArtifacts: Artifact[] = [
    {
        id: 'a1-uuid',
        title: 'README.md',
        artifactType: 'FILE',
        sourceSystem: 'GITHUB',
        sourceId: 'abc123',
        sourceUrl: 'https://github.com/repo/blob/main/README.md',
        mime: 'text/markdown',
        language: 'markdown',
        ingestedAt: '2026-04-15T10:00:00Z',
        createdAtSource: '2026-04-15T10:00:00Z',
        updatedAtSource: '2026-04-15T10:00:00Z',
        contentHash: 'hash1',
        ingestionRunId: 'run-1',
    },
    {
        id: 'a2-uuid',
        title: 'SPRINT-123: Add Keycloak Authentication',
        artifactType: 'ISSUE',
        sourceSystem: 'JIRA',
        sourceId: 'SPRINT-123',
        sourceUrl: null,
        mime: null,
        language: null,
        ingestedAt: '2026-04-10T08:00:00Z',
        createdAtSource: '2026-04-10T08:00:00Z',
        updatedAtSource: '2026-04-12T09:00:00Z',
        contentHash: null,
        ingestionRunId: 'run-1',
    },
];

const uploadList = [
    { id: 'u1-uuid', filename: 'deployment-runbook.md', mime: 'text/markdown', uploadedAt: '2026-06-01T12:00:00Z' },
];

const mockProfile = {
    id: 'user-uuid',
    authId: 'auth-id',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    projectRoles: [{ id: 'proj-1', name: 'Project One' }],
    permissionGroup: 'USER' as const,
    enabled: true,
    profileIcon: null,
    hasCompletedOnboarding: true,
};

describe('knowledgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUnifiedArtifacts', () => {
        it('returns project artifacts merged with uploads mapped to the Artifact shape', async () => {
            mockFetch.mockImplementation((endpoint: string) => {
                if (endpoint.includes('/artifacts')) return Promise.resolve({ items: projectArtifacts, page: { totalPages: 1 } });
                if (endpoint.includes('/uploads')) return Promise.resolve(uploadList);
                return Promise.resolve([]);
            });
            mockGetProfile.mockResolvedValue(mockProfile);

            const { knowledgeService } = await import('../../../src/services/knowledgeService');
            const result = await knowledgeService.getUnifiedArtifacts('proj-1');

            expect(result).toHaveLength(3);

            expect(result[0]).toEqual(projectArtifacts[0]);
            expect(result[1]).toEqual(projectArtifacts[1]);

            expect(result[2]).toMatchObject({
                id: 'u1-uuid',
                title: 'deployment-runbook.md',
                artifactType: 'FILE',
                sourceSystem: 'UPLOAD',
                sourceId: 'u1-uuid',
                sourceUrl: null,
                mime: 'text/markdown',
                language: null,
                contentHash: null,
                ingestionRunId: null,
            });
        });

        it('returns only uploads when the artifacts endpoint fails', async () => {
            mockFetch.mockImplementation((endpoint: string) => {
                if (endpoint.includes('/artifacts')) return Promise.reject(new Error('403 Forbidden'));
                if (endpoint.includes('/uploads')) return Promise.resolve(uploadList);
                return Promise.resolve([]);
            });
            mockGetProfile.mockResolvedValue({ ...mockProfile, projectRoles: [] });

            const { knowledgeService } = await import('../../../src/services/knowledgeService');
            const result = await knowledgeService.getUnifiedArtifacts('proj-1');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('u1-uuid');
        });

        it('returns an empty list when no artifacts and no profile', async () => {
            mockFetch.mockImplementation((endpoint: string) => {
                if (endpoint.includes('/artifacts')) return Promise.resolve({ items: [], page: { totalPages: 1 } });
                return Promise.resolve([]);
            });
            mockGetProfile.mockResolvedValue(null);

            const { knowledgeService } = await import('../../../src/services/knowledgeService');
            const result = await knowledgeService.getUnifiedArtifacts('proj-1');

            expect(result).toEqual([]);
        });
    });

    describe('getArtifactContent', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('fetches raw content with the correct headers and returns content + mime type', async () => {
            const { knowledgeService } = await import('../../../src/services/knowledgeService');

            const mockResponse = {
                ok: true,
                status: 200,
                text: () => Promise.resolve('# Hello world'),
                headers: {
                    get: (name: string) => (name === 'Content-Type' ? 'text/markdown' : null),
                },
            };

            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

            const result = await knowledgeService.getArtifactContent('proj-1', 'a1-uuid');

            expect(fetchSpy).toHaveBeenCalled();
            const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe('/api/v1/projects/proj-1/artifacts/a1-uuid/content');
            const calledHeaders = (calledOptions as RequestInit).headers as Record<string, string>;
            expect(calledHeaders.Authorization).toBe('Bearer fake-token');
            expect(result).toEqual({ content: '# Hello world', mimeType: 'text/markdown' });
        });

        it('falls back to text/plain when Content-Type header is missing', async () => {
            const { knowledgeService } = await import('../../../src/services/knowledgeService');

            const mockResponse = {
                ok: true,
                status: 200,
                text: () => Promise.resolve('plain text body'),
                headers: { get: () => null },
            };

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

            const result = await knowledgeService.getArtifactContent('proj-1', 'a1-uuid');

            expect(result.mimeType).toBe('text/plain');
        });

        it('throws an ApiError on a non-OK response', async () => {
            const { knowledgeService } = await import('../../../src/services/knowledgeService');

            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: () => Promise.resolve('Artifact not found'),
                headers: { get: () => null },
            };

            vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

            await expect(knowledgeService.getArtifactContent('proj-1', 'a1-uuid')).rejects.toThrow();
        });
    });
});
