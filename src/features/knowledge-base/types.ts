export type Freshness = 'current' | 'stale' | 'outdated' | 'all';
export type ArtifactType = 'Documentation' | 'ADR' | 'Runbook' | 'Guide' | 'all';

export interface Artifact {
    id: string;
    title: string;
    type: ArtifactType;
    owner: string;
    lastUpdated: string;
    freshness: Freshness;
    canonical: boolean;
    tags: string[];
    excerpt: string;
    aiSummary?: string;
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
