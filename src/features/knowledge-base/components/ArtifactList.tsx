import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileCode, FileImage, LayoutTemplate, ChevronRight } from 'lucide-react';
import type { Artifact, ArtifactType, Freshness } from '../types';

interface ArtifactListProps {
    artifacts: Artifact[];
    onSelect: (id: string) => void;
}

const getIcon = (type: ArtifactType) => {
    switch (type) {
        case 'Documentation': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'ADR': return <LayoutTemplate className="w-5 h-5 text-purple-500" />;
        case 'Runbook': return <FileCode className="w-5 h-5 text-orange-500" />;
        case 'Guide': return <FileImage className="w-5 h-5 text-green-500" />;
        default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
};

const getFreshnessColor = (freshness: Freshness) => {
    switch (freshness) {
        case 'current': return 'text-app-success-500 bg-app-success-500/10 border-app-success-500/20';
        case 'stale': return 'text-app-warning-500 bg-app-warning-500/10 border-app-warning-500/20';
        case 'outdated': return 'text-app-danger-500 bg-app-danger-500/10 border-app-danger-500/20';
        default: return 'text-gray-500 bg-gray-100 border-gray-200';
    }
};

export function ArtifactList({ artifacts, onSelect }: ArtifactListProps) {
    if (artifacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-app-text-muted">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>No artifacts found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {artifacts.map((artifact) => (
                    <motion.div
                        key={artifact.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${artifact.title}`}
                        data-testid="artifact-card"
                        onClick={() => onSelect(artifact.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSelect(artifact.id);
                            }
                        }}
                        className="p-4 bg-app-surface border border-app-border rounded-xl hover:border-app-brand/50 hover:shadow-md transition-all flex items-start gap-4 cursor-pointer group"
                    >
                        <div className="p-2 bg-app-background rounded-lg shrink-0 border border-app-border">
                            {getIcon(artifact.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-app-text truncate">{artifact.title}</h3>
                                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-md bg-app-background border border-app-border text-app-text-muted">
                                    {artifact.type}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md border ${getFreshnessColor(artifact.freshness)}`}>
                                    {artifact.freshness}
                                </span>
                            </div>
                            <p className="text-sm text-app-text-muted line-clamp-2 mb-2">{artifact.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs font-medium text-app-text-muted">
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] text-blue-700">
                                        {artifact.owner[0]}
                                    </div>
                                    {artifact.owner}
                                </span>
                                <span>Updated: {artifact.lastUpdated}</span>
                            </div>
                        </div>
                        <div className="shrink-0 pt-2">
                            <ChevronRight className="w-5 h-5 text-app-text-muted group-hover:text-app-brand transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
