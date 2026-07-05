import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import { ArtifactFilters, ArtifactList, ArtifactViewerDrawer, UploadArtifactModal } from '../features/knowledge-base/components';
import type { Artifact, ArtifactType, Freshness } from '../features/knowledge-base/types';
import { PageHeader } from '../components/layout/PageHeader';

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

    // Upload State
    const [isUploadScreenOpen, setIsUploadScreenOpen] = useState(false);

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
        <div className="min-h-screen bg-app-bg text-app-text flex flex-col">
            <header className="border-b border-app-border bg-app-bg">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="app-page-frame py-6"
                >
                    <PageHeader
                        icon={BookOpen}
                        title="Knowledge Base"
                        subtitle="Explore unified project documentation, code runbooks, and artifacts."
                    />
                </motion.div>
            </header>

            <main className="flex-1 flex flex-col app-page-frame py-6 sm:space-y-10 lg:py-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
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
                    <div className="flex items-center justify-between mt-8 mb-4">
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

                {/* Upload Action Button */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsUploadScreenOpen(true)}
                    className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-app-brand text-white shadow-lg shadow-app-brand/25 transition-colors hover:bg-app-brand-hover focus:outline-none focus:ring-2 focus:ring-app-brand focus:ring-offset-2 focus:ring-offset-app-bg"
                    aria-label="Upload new artifact"
                >
                    <Plus className="h-6 w-6" />
                </motion.button>

                {/* Upload Modal */}
                <UploadArtifactModal
                    isOpen={isUploadScreenOpen}
                    onClose={() => setIsUploadScreenOpen(false)}
                    projectId={projectId}
                />

                {/* Viewer Drawer */}
                <ArtifactViewerDrawer 
                    artifact={selectedArtifact} 
                    onClose={() => setSelectedArtifactId(null)}
                    projectId={projectId}
                />
            </main>
        </div>
    );
}
