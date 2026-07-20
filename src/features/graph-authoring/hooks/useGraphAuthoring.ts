import { useCallback, useEffect, useState } from 'react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { CompetencyEdgeProposal, CompetencyProposal, GenerateGraphResult } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Owns the competency graph authoring state: the pending proposal lists, triggering AI
 * generation, and approving/rejecting individual competencies/edges. A resolved proposal is no
 * longer PROPOSED, so it's removed from local state immediately rather than waiting on a refetch.
 */
export function useGraphAuthoring() {
    const [competencies, setCompetencies] = useState<CompetencyProposal[]>([]);
    const [edges, setEdges] = useState<CompetencyEdgeProposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generateResult, setGenerateResult] = useState<GenerateGraphResult | null>(null);

    const loadProposed = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const graph = await competencyGraphService.fetchProposed();
            setCompetencies(graph.competencies);
            setEdges(graph.edges);
        } catch (err) {
            setError(toMessage(err, 'Could not load proposals.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await loadProposed();
        })();
    }, [loadProposed]);

    const generate = useCallback(async () => {
        setIsGenerating(true);
        setError(null);
        setGenerateResult(null);
        try {
            const result = await competencyGraphService.generate();
            setGenerateResult(result);
            await loadProposed();
        } catch (err) {
            setError(toMessage(err, 'Could not generate proposals.'));
        } finally {
            setIsGenerating(false);
        }
    }, [loadProposed]);

    const approveCompetency = useCallback(async (id: string) => {
        await competencyGraphService.approveCompetency(id);
        setCompetencies(prev => prev.filter(c => c.id !== id));
    }, []);

    const rejectCompetency = useCallback(async (id: string, reason?: string) => {
        await competencyGraphService.rejectCompetency(id, reason);
        setCompetencies(prev => prev.filter(c => c.id !== id));
    }, []);

    const approveEdge = useCallback(async (id: string) => {
        await competencyGraphService.approveEdge(id);
        setEdges(prev => prev.filter(e => e.id !== id));
    }, []);

    const rejectEdge = useCallback(async (id: string, reason?: string) => {
        await competencyGraphService.rejectEdge(id, reason);
        setEdges(prev => prev.filter(e => e.id !== id));
    }, []);

    /**
     * Approves everything currently proposed as one graph version.
     *
     * Not just a convenience. Approved one at a time, an edge lands in its own version into a
     * node that already exists, which the backend classifies as structural and holds back until
     * each hire's next session -- so the node shows up first with no prerequisites and can
     * re-lock once its edges arrive. Approved together, the node and its edges arrive wired.
     */
    const approveAll = useCallback(async () => {
        if (competencies.length === 0 && edges.length === 0) return;
        setError(null);
        try {
            await competencyGraphService.approveBatch(
                competencies.map(c => c.id),
                edges.map(e => e.id)
            );
            setCompetencies([]);
            setEdges([]);
        } catch (err) {
            setError(toMessage(err, 'Could not approve these proposals.'));
            // The batch is all-or-nothing on the backend, so local state is stale either way.
            await loadProposed();
        }
    }, [competencies, edges, loadProposed]);

    return {
        approveAll,
        competencies,
        edges,
        isLoading,
        isGenerating,
        error,
        generateResult,
        generate,
        approveCompetency,
        rejectCompetency,
        approveEdge,
        rejectEdge,
    };
}
