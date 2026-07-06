import { Search } from 'lucide-react';
import type { ArtifactType, SourceSystem } from '../types';

export interface ArtifactFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedType: ArtifactType | 'all';
    onTypeChange: (type: ArtifactType | 'all') => void;
    selectedSource: SourceSystem | 'all';
    onSourceChange: (source: SourceSystem | 'all') => void;
}

export function ArtifactFilters({
    searchQuery,
    onSearchChange,
    selectedType,
    onTypeChange,
    selectedSource,
    onSourceChange,
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
            <div className="flex flex-wrap gap-2">
                <select
                    value={selectedSource}
                    onChange={(e) => onSourceChange(e.target.value as SourceSystem | 'all')}
                    className="px-3 py-2 bg-app-surface border border-app-border rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-brand/20"
                >
                    <option value="all">All Sources</option>
                    <option value="GITHUB">GitHub</option>
                    <option value="UPLOAD">Uploads</option>
                </select>
                <select
                    value={selectedType}
                    onChange={(e) => onTypeChange(e.target.value as ArtifactType | 'all')}
                    className="px-3 py-2 bg-app-surface border border-app-border rounded-lg text-app-text text-sm focus:outline-none focus:ring-2 focus:ring-app-brand/20"
                >
                    <option value="all">All Types</option>
                    <option value="COMMIT">Commit</option>
                    <option value="FILE">File</option>
                    <option value="ISSUE">Issue</option>
                    <option value="PULL_REQUEST">Pull Request</option>
                </select>
            </div>
        </div>
    );
}
