/**
 * Defines the specific entity type of an artifact.
 * Used by the UI to determine icon representations and filtering logic.
 */
export type ArtifactType = 'COMMIT' | 'FILE' | 'ISSUE' | 'PULL_REQUEST';

/**
 * Origin source of the artifact data.
 * Used to route API calls (e.g., Github vs internal Uploads).
 */
export type SourceSystem = 'GITHUB' | 'JIRA' | 'UPLOAD';

/**
 * Core business entity representing any indexed piece of knowledge.
 * Unifies diverse sources (like Github PRs and direct file uploads) into a single
 * searchable and summariable format.
 */
export interface Artifact {
    id: string;
    title: string | null;
    artifactType: ArtifactType;
    sourceSystem: SourceSystem;
    sourceId: string;
    sourceUrl: string | null;
    mime: string | null;
    language: string | null;
    ingestedAt: string;
    createdAtSource: string | null;
    updatedAtSource: string | null;
    contentHash: string | null;
    ingestionRunId: string | null;
}

/**
 * The raw content of an artifact retrieved from the backend, 
 * along with its MIME type for correct rendering (Markdown vs plain text).
 */
export interface ArtifactContent {
    content: string;
    mimeType: string;
}

/**
 * Citation metadata for an AI-generated artifact summary, sourced from the AI service
 * and passed through the backend unchanged.
 */
export interface ArtifactSummaryCitation {
    artifactId: string;
    filename: string;
    sourceUrl: string | null;
}

/**
 * AI-generated summary for one artifact, returned as a single JSON response.
 *
 * @remarks The backend caches summaries by content hash, so repeat requests for unchanged
 * content return instantly. The `summary` is GFM Markdown (with math) rendered client-side.
 */
export interface ArtifactSummaryResponse {
    artifactId: string;
    summary: string;
    citations: ArtifactSummaryCitation[];
}
