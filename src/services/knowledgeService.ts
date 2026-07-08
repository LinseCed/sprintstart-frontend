import { apiClient, ApiError } from './apiClient';
import { userService } from './userService';
import keycloak from '../config/keycloak';
import type { Artifact, ArtifactContent, SummaryStreamHandlers } from '../features/knowledge-base/types';

/**
 * Service responsible for managing the knowledge base unified artifacts.
 */
export const knowledgeService = {
    /**
     * Fetches all unified artifacts for a specific project, merged with the
     * authenticated user's personal uploads (mapped into the same Artifact shape).
     *
     * @param projectId UUID of the project to scope the artifact listing.
     * @returns Merged list of project-scoped artifacts and the user's uploads.
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
                const uploads = await apiClient.fetch<UploadListItemResponse[]>(`/api/v1/uploads?uploaderId=${profile.id}`);

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

                // Deduplicate to avoid React key collisions if an upload is also in project artifacts
                const existingIds = new Set(artifacts.map(a => a.id));
                const uniqueUploads = uploadArtifacts.filter(a => !existingIds.has(a.id));

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
    async getArtifactContent(projectId: string, artifactId: string, sourceSystem: string = 'GITHUB'): Promise<ArtifactContent> {
        try {
            if (keycloak.authenticated) {
                await keycloak.updateToken(30);
            }
        } catch (error) {
            console.error('Failed to refresh Keycloak token for artifact content', error);
            void keycloak.login();
            throw new Error('Authentication required');
        }

        const endpoint = sourceSystem === 'UPLOAD'
            ? `/api/v1/uploads/${artifactId}/content`
            : `/api/v1/projects/${projectId}/artifacts/${artifactId}/content`;

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
     * Streams an AI summary of a specific artifact via Server-Sent Events.
     *
     * @param projectId UUID of the project that scopes the artifact.
     * @param artifactId UUID of the artifact to summarize.
     * @param handlers Callbacks for receiving streamed tokens, completion, and errors.
     */
    async summarizeArtifact(projectId: string, artifactId: string, handlers: SummaryStreamHandlers): Promise<void> {
        try {
            if (keycloak.authenticated) {
                await keycloak.updateToken(30);
            }
        } catch (error) {
            console.error('Failed to refresh Keycloak token for summary stream', error);
            void keycloak.login();
            return;
        }

        const res = await fetch(`/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keycloak.token}`
            }
        });

        if (!res.ok) {
            handlers.onError?.(new Error(`HTTP error! status: ${res.status}`));
            return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
            throw new Error("No response stream");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.startsWith("data:")) continue;

                try {
                    const data = JSON.parse(line.slice(6)) as { type: string, content?: string, message?: string };

                    if (data.type === 'token' && data.content) {
                        handlers.onToken(data.content);
                    } else if (data.type === 'done') {
                        handlers.onDone();
                        return;
                    } else if (data.type === 'error') {
                        handlers.onError?.(new Error(data.message || 'Stream error'));
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse SSE line", line, e);
                }
            }
        }

        handlers.onDone();
    },

    /**
     * Uploads an array of files sequentially to the backend ingestion service.
     * 
     * @param _projectId UUID of the project (currently unused, binds to uploaderId on backend).
     * @param files Array of physical File objects selected by the user.
     * @returns Array of results indicating success or failure per file.
     */
    async uploadDocuments(_projectId: string, files: File[]): Promise<{ filename: string; status: 'success' | 'error'; error?: string }[]> {
        const results: { filename: string; status: 'success' | 'error'; error?: string }[] = [];

        const profile = await userService.getProfile();
        if (!profile) {
            throw new Error("Could not retrieve backend user profile for upload.");
        }

        const uploaderId = profile.id;

        for (const file of files) {
            const formData = new FormData();
            formData.append('files', file);

            try {
                interface UploadResponseItem {
                    filename: string;
                    status: string;
                    error?: string;
                }

                const uploadResults = await apiClient.fetch<UploadResponseItem[]>(`/api/v1/uploads?uploaderId=${uploaderId}`, {
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
