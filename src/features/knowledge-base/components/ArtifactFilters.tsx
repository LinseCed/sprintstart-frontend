import { Search } from 'lucide-react';
import type { Freshness, ArtifactType } from '../types';

export interface ArtifactFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedType: ArtifactType;
    onTypeChange: (type: ArtifactType) => void;
    selectedFreshness: Freshness;
    onFreshnessChange: (freshness: Freshness) => void;
}

export function ArtifactFilters({
    searchQuery,
    onSearchChange,
    selectedType,
    onTypeChange,
    selectedFreshness,
    onFreshnessChange
}: ArtifactFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                <input
                    type="text"
                    placeholder="Search knowledge base..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-lg text-app-text focus:outline-none focus:ring-2 focus:ring-app-brand/20 focus:border-app-brand"
                />
            </div>
            <div className="flex gap-2">
                <select
                    value={selectedType}
                    onChange={(e) => onTypeChange(e.target.value as ArtifactType)}
                    className="px-3 py-2 bg-app-surface border border-app-border rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-brand/20"
                >
                    <option value="all">All Types</option>
                    <option value="Documentation">Documentation</option>
                    <option value="ADR">ADR</option>
                    <option value="Runbook">Runbook</option>
                    <option value="Guide">Guide</option>
                </select>
                <select
                    value={selectedFreshness}
                    onChange={(e) => onFreshnessChange(e.target.value as Freshness)}
                    className="px-3 py-2 bg-app-surface border border-app-border rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-brand/20"
                >
                    <option value="all">Any Freshness</option>
                    <option value="current">Current</option>
                    <option value="stale">Stale</option>
                    <option value="outdated">Outdated</option>
                </select>
            </div>
        </div>
    );
}
