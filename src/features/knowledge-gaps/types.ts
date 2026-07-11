export interface KnowledgeGapOwner {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    // Project role of the owner, derived by the backend. May be absent.
    role?: string;
}

export type KnowledgeGapSeverity = 'high' | 'medium' | 'low';

export interface KnowledgeGap {
    id: string;
    component: string;
    missingTypes: string[];
    // Document types the component already has. Provided by the AI; not always rendered yet.
    presentTypes?: string[];
    lastUpdated: string;
    // Populated by the backend once component owners are assigned; empty until then.
    owners: KnowledgeGapOwner[];
    severity: KnowledgeGapSeverity;
}

export interface KnowledgeGapOverview {
    gaps: KnowledgeGap[];
}