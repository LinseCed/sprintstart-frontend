export type ArtifactType = 'COMMIT' | 'FILE' | 'ISSUE' | 'PULL_REQUEST';
export type SourceSystem = 'GITHUB' | 'JIRA' | 'UPLOAD';

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

export interface ArtifactContent {
    content: string;
    mimeType: string;
}

export interface SummaryStreamHandlers {
    onToken: (token: string) => void;
    onDone: () => void;
    onError?: (error: Error) => void;
}
