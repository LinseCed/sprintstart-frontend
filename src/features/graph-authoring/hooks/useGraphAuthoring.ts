import { useCallback, useEffect, useMemo, useState } from 'react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { AiProgressItem } from '../../../services/aiStreamService';
import { useAiStream } from '../../ai-activity/useAiStream';
import type {
    CompetencyEdgeProposal,
    CompetencyKind,
    CompetencyProposal,
    EdgeKind,
    ProposedGraph
} from '../types';

const GRAPH_GENERATE_STREAM = '/api/v1/onboarding/competency-graph/generate/stream';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function optionalStr(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Turns the raw `item` payloads streamed during generation into a [ProposedGraph] the studio graph
 * can draw as it assembles. An item is either a competency (`key`) or an edge (`from_key`); its keys
 * are snake_case because the backend relays the AI's own payload. These carry synthetic ids — they
 * are a live preview, replaced wholesale by the authoritative re-read once the stream ends, so the
 * ids are never used for a review action.
 */
function itemsToProposedGraph(items: AiProgressItem[]): ProposedGraph {
    const competencies: CompetencyProposal[] = [];
    const edges: CompetencyEdgeProposal[] = [];
    items.forEach((item, index) => {
        const fromKey = item.from_key ?? item.fromKey;
        if (typeof fromKey === 'string') {
            edges.push({
                id: `preview-edge-${index}`,
                fromKey,
                toKey: str(item.to_key ?? item.toKey),
                kind: str(item.kind, 'RELATED') as EdgeKind,
                rationale: optionalStr(item.rationale),
                status: 'PROPOSED'
            });
            return;
        }
        if (typeof item.key === 'string') {
            competencies.push({
                id: `preview-node-${index}`,
                key: str(item.key),
                label: str(item.label, str(item.key)),
                description: optionalStr(item.description),
                kind: str(item.kind, 'SKILL') as CompetencyKind,
                repoRef: optionalStr(item.repo_ref ?? item.repoRef),
                status: 'PROPOSED'
            });
        }
    });
    return { competencies, edges };
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
    const aiStream = useAiStream();

    // The graph assembling live: each streamed node/edge item drawn as a pending addition, replaced
    // by the authoritative re-read once the stream ends. A memo so the studio graph re-lays out only
    // when a new item actually lands.
    const streamingProposals = useMemo(() => itemsToProposedGraph(aiStream.items), [aiStream.items]);

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
        aiStream.reset();
        // Watch the graph assemble: each grounded competency, then each accepted edge, streams in as
        // an item. On a clean finish re-read the authoritative proposals (the stream is a view, so the
        // stored set is the source of truth); on failure fall back to a plain re-read so a dropped
        // stream never costs the result.
        const ok = await aiStream.start(GRAPH_GENERATE_STREAM);
        if (ok) {
            await loadProposed();
        } else {
            setError(aiStream.errorMessage ?? 'Could not generate proposals.');
            await loadProposed();
        }
        setIsGenerating(false);
    }, [aiStream, loadProposed]);

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
        generate,
        // Live generation surface: the assembling preview, the activity log, and the phase so the
        // page can show nodes/edges landing and fall back to the settled proposals when it ends.
        streamingProposals,
        streamActivity: aiStream.entries,
        streamPhase: aiStream.phase,
        approveCompetency,
        rejectCompetency,
        approveEdge,
        rejectEdge,
    };
}
