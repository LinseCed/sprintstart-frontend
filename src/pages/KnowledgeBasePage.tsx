import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import { ArtifactFilters, ArtifactList, ArtifactViewerDrawer } from '../features/knowledge-base/components';
import type { Artifact, ArtifactType, Freshness } from '../features/knowledge-base/types';

/**
 * Unified Knowledge Base view for project resources.
 * Displays all artifacts (uploads, github, etc.) in a filtered grid, 
 * with a side drawer for viewing raw content and AI summaries.
 */
export function KnowledgeBasePage() {
    
    // Hardcoded project ID per plan
    const projectId = "default";
    
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<ArtifactType>('all');
    const [selectedFreshness, setSelectedFreshness] = useState<Freshness>('all');
    
    // Viewer State
    const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true);

        knowledgeService.getUnifiedArtifacts(projectId)
            .then(data => {
                if (isMounted) setArtifacts(data);
            })
            .catch(error => {
                console.error("Failed to load artifacts", error);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [projectId]);

    // Derived Filtered List
    const filteredArtifacts = useMemo(() => {
        return artifacts.filter(artifact => {
            // Search Match
            const matchesSearch = !searchQuery || 
                artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                artifact.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                artifact.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            // Type Match
            const matchesType = selectedType === 'all' || artifact.type === selectedType;

            // Freshness Match
            const matchesFreshness = selectedFreshness === 'all' || artifact.freshness === selectedFreshness;

            return matchesSearch && matchesType && matchesFreshness;
        });
    }, [artifacts, searchQuery, selectedType, selectedFreshness]);

    const selectedArtifact = useMemo(() => 
        artifacts.find(a => a.id === selectedArtifactId) || null,
    [artifacts, selectedArtifactId]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setSelectedFreshness('all');
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-app-background p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-app-brand/10 rounded-lg text-app-brand">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-app-text tracking-tight">
                            Knowledge Base
                        </h1>
                    </div>
                    <p className="text-app-text-muted">
                        Explore unified project documentation, code runbooks, and artifacts.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <ArtifactFilters 
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedType={selectedType}
                        onTypeChange={setSelectedType}
                        selectedFreshness={selectedFreshness}
                        onFreshnessChange={setSelectedFreshness}
                    />
                </motion.div>

                {/* Results Count & Clear */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-app-text-muted">
                        {filteredArtifacts.length} {filteredArtifacts.length === 1 ? 'result' : 'results'}
                    </p>
                    {(searchQuery || selectedType !== 'all' || selectedFreshness !== 'all') && (
                        <button 
                            onClick={handleClearFilters}
                            className="text-sm font-medium text-app-brand hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Main List */}
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-app-brand border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <ArtifactList 
                        artifacts={filteredArtifacts} 
                        onSelect={setSelectedArtifactId} 
                    />
                )}
            </div>

            {/* Viewer Drawer */}
            <ArtifactViewerDrawer 
                artifact={selectedArtifact} 
                onClose={() => setSelectedArtifactId(null)}
                projectId={projectId}
            />
        </div>
    );
}