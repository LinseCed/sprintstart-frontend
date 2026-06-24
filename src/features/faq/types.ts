// features/insights/types.ts

// ── FAQ OVERVIEW ────────────────────────────────────────────

export interface FAQGroup {
    groupId: string;
    count: number;
    question: string;
    topDocuments: FAQDocumentPreview[];
}

export interface FAQDocumentPreview {
    id: string;
    title: string;
}

export interface FAQOverview {
    groups: FAQGroup[];
}

// ── FAQ DETAIL ──────────────────────────────────────────────

export interface FAQQuestion {
    id: string;
    text: string;
    askedBy: FAQAskedBy[];
}

export interface FAQAskedBy {
    userId: string;
    name: string;
    askedAt: string;
}

export interface FAQDocument {
    id: string;
    title: string;
    source: string;
    url: string;
}

export interface FAQDetail {
    groupId: string;
    count: number;
    questions: FAQQuestion[];
    answeringDocuments: FAQDocument[];
}