import { apiClient, ApiError } from './apiClient';
import { userService } from './userService';
import keycloak from '../config/keycloak';
import type { Artifact, ArtifactContent, ArtifactSummaryResponse } from '../features/knowledge-base/types';

/**
 * Service responsible for managing the knowledge base unified artifacts.
 */
interface UploadResponseItem {
    filename: string;
    status: string;
    error?: string;
}

export const knowledgeService = {
    /**
     * Fetches all unified artifacts for a specific project, merged with the
     * authenticated user's personal uploads (mapped into the same Artifact shape).
     *
     * @param projectId UUID of the project to scope the artifact listing.
     * @returns Merged list of project-scoped artifacts and the user's uploads.
     *
     * @remarks Failure behavior: both downstream endpoints are best-effort. If the
     * project artifacts endpoint or the personal-uploads endpoint fails, the error
     * is logged via `console.warn` and the function returns whatever it could fetch
     * (possibly an empty array) rather than throwing. This keeps the KB page usable
     * while the ingestion service is still being rolled out.
     *
     * @remarks Known limitation: uploads are de-duplicated against project artifacts
     * by `title` (filename) because the backend does not yet return `sourceId` for
     * ingested artifacts. Two unrelated uploads sharing a filename will collide.
     */
    async getUnifiedArtifacts(projectId: string): Promise<Artifact[]> {
        let artifacts: Artifact[] = [];

        try {
            interface PageResponse {
                items: Artifact[];
                page: {
                    totalPages: number;
                };
            }
            
            let currentPage = 1;
            let totalPages = 1;
            
            while (currentPage <= totalPages) {
                const response = await apiClient.fetch<PageResponse>(`/api/v1/projects/${projectId}/artifacts?page=${currentPage}&size=100`);
                artifacts = [...artifacts, ...(response.items || [])];
                totalPages = response.page?.totalPages || 1;
                currentPage++;
            }
        } catch (e) {
            console.warn("Unified artifacts endpoint failed (expected if missing), continuing...", e);
        }

        try {
            const profile = await userService.getProfile();
            if (profile) {
                interface UploadListItemResponse {
                    id: string;
                    filename: string;
                    mime: string;
                    uploadedAt: string;
                }
                const uploads = await apiClient.fetch<UploadListItemResponse[]>(`/api/v1/uploads?uploaderId=${encodeURIComponent(profile.id)}`);

                const uploadArtifacts: Artifact[] = uploads.map(u => ({
                    id: u.id,
                    title: u.filename,
                    artifactType: 'FILE',
                    sourceSystem: 'UPLOAD',
                    sourceId: u.id,
                    sourceUrl: null,
                    mime: u.mime,
                    language: null,
                    ingestedAt: u.uploadedAt,
                    createdAtSource: null,
                    updatedAtSource: u.uploadedAt,
                    contentHash: null,
                    ingestionRunId: null,
                }));

                // Deduplicate using title (filename) as a temporary frontend workaround,
                // because the backend doesn't return sourceId for ingested artifacts yet.
                const existingTitles = new Set(artifacts.map(a => a.title));
                const uniqueUploads = uploadArtifacts.filter(a => !existingTitles.has(a.title));

                artifacts = [...artifacts, ...uniqueUploads];
            }
        } catch (e) {
            console.warn("Failed to fetch personal uploads", e);
        }

        return artifacts;
    },

    /**
     * Fetches the raw content of a specific artifact.
     *
     * Bypasses `apiClient.fetch` (which JSON-parses) because the backend returns
     * raw bytes with a `Content-Type` header, not a JSON envelope.
     *
     * @param projectId UUID of the project that scopes the artifact.
     * @param artifactId UUID of the artifact whose content should be retrieved.
     * @returns The raw content text and its effective mime type.
     */
    async getArtifactContent(projectId: string, artifactId: string, _sourceSystem: string = 'GITHUB'): Promise<ArtifactContent> {
        try {
            if (keycloak.authenticated) {
                await keycloak.updateToken(30);
            }
        } catch (error) {
            console.error('Failed to refresh Keycloak token for artifact content', error);
            void keycloak.login();
            throw new Error('Authentication required');
        }

        const endpoint = `/api/v1/projects/${projectId}/artifacts/${artifactId}/content`;

        const response = await fetch(endpoint, {
            headers: keycloak.token ? { 'Authorization': `Bearer ${keycloak.token}` } : {},
        });

        if (response.status === 401) {
            void keycloak.login();
            throw new ApiError(401, 'Unauthorized');
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new ApiError(response.status, errorBody || response.statusText);
        }

        const content = await response.text();
        const mimeType = response.headers.get('Content-Type') ?? 'text/plain';

        return { content, mimeType };
    },

    /**
     * Requests an AI-generated summary for a specific artifact.
     *
     * Uses `apiClient.fetch` because the backend returns a JSON envelope (not raw bytes or
     * an SSE stream). The backend caches the summary by content hash, so repeat calls for
     * unchanged content return instantly.
     *
     * @param projectId UUID of the project that scopes the artifact.
     * @param artifactId UUID of the artifact to summarize.
     * @returns The summary text (GFM Markdown) and its citations.
     * @throws {ApiError} On a non-2xx backend response (e.g. 403 no access, 404 not found,
     * 503 AI service unavailable).
     */
    async summarizeArtifact(projectId: string, artifactId: string): Promise<ArtifactSummaryResponse> {
        return apiClient.fetch<ArtifactSummaryResponse>(
            `/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`,
            { method: 'POST' },
        );
    },

    /**
     * Uploads an array of files sequentially to the backend ingestion service.
     * 
     * @param projectId UUID of the project.
     * @param files Array of physical File objects selected by the user.
     * @returns Array of results indicating success or failure per file.
     */
    async uploadDocuments(projectId: string, files: File[]): Promise<{ filename: string; status: 'success' | 'error'; error?: string }[]> {
        const results: { filename: string; status: 'success' | 'error'; error?: string }[] = [];

        const profile = await userService.getProfile();
        if (!profile) {
            throw new Error("Could not retrieve backend user profile for upload.");
        }

        const uploaderId = profile.id;

        for (const file of files) {
            const formData = new FormData();
            formData.append('files', file);

            const requestPayload = {
                projectId,
                uploaderId
            };
            formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));

            try {
                const uploadResults = await apiClient.fetch<UploadResponseItem[]>(`/api/v1/uploads`, {
                    method: 'POST',
                    body: formData,
                });

                const mappedResults = uploadResults.map((res): { filename: string; status: 'success' | 'error'; error?: string } => ({
                    filename: String(res.filename),
                    status: res.status === 'failed' ? 'error' : 'success',
                    error: res.error ? String(res.error) : undefined
                }));
                results.push(...mappedResults);
            } catch (error) {
                console.error(`Failed to upload file ${file.name}:`, error);
                results.push({
                    filename: file.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    }
};
