export interface KnowledgeGapOwner {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    workingArea: string;
}

export type KnowledgeGapSeverity = 'high' | 'medium' | 'low';

export interface KnowledgeGap {
    id: string;
    component: string;
    missingTypes: string[];
    lastUpdated: string;
    owners: KnowledgeGapOwner[];
    severity: KnowledgeGapSeverity;
    relatedQuestions: number;
}

export interface KnowledgeGapOverview {
    gaps: KnowledgeGap[];
}