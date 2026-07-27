import { useMemo } from 'react';
import { type GraphShape } from '../../competency-graph/layout';
import { DiagramCanvas, type DiagramCanvasEdge } from '../../graph-diagram/DiagramCanvas';
import { StudioGraphNode, type AuthoringState } from './StudioGraphNode';
import type { LiveCompetency, LiveGraph, ProposedGraph } from '../types';
import type { ModuleReadiness } from '../hooks/useModuleAuthoring';

type StudioGraphProps = {
    graph: LiveGraph;
    /** Per-competency module state for the selected project; empty when none is selected. */
    readinessByKey: Map<string, ModuleReadiness>;
    /** Proposals awaiting review, drawn alongside the live graph as pending additions. */
    proposals: ProposedGraph;
    selectedKey: string | null;
    onSelectKey: (key: string | null) => void;
    /** Called with (prerequisite, dependent) when a node is dragged onto another. */
    onConnectNodes: (fromKey: string, toKey: string) => void;
};

const nodeTypes = { studioCompetency: StudioGraphNode };

/** A proposed node has no live row yet, so it is shown with the defaults it would be created with. */
function proposalAsCompetency(proposal: ProposedGraph['competencies'][number]): LiveCompetency {
    return {
        key: proposal.key,
        label: proposal.label,
        description: proposal.description,
        kind: proposal.kind,
        targetLevel: 0,
        invariant: false,
        repoRef: proposal.repoRef
    };
}

function authoringStateFor(key: string, readiness: Map<string, ModuleReadiness>): AuthoringState {
    const entry = readiness.get(key);
    if (entry?.activeModuleId) return 'PUBLISHED';
    if (entry?.pending) return 'PENDING';
    return 'EMPTY';
}

/**
 * The competency graph as the authoring surface: the whole live graph, plus what the AI has
 * proposed, drawn together so a PM approves a proposal in the context of the graph it would join.
 *
 * Two things separate it from any other diagram in the app. Nodes are coloured by **authoring
 * readiness** — whether a module is published, drafted or missing — because "mastered/available"
 * describes a person's progress and means nothing on the shared graph. And proposals are drawn as
 * dashed ghosts wired into the live nodes they connect to, rather than sitting in a list beside a
 * picture of the graph.
 *
 * Everything that is *not* specific to authoring — layout, the chain that lights on hover or
 * selection, the dimming, reduced motion, the canvas itself — belongs to `DiagramCanvas`, so this
 * surface and the hire's cannot drift into reading differently.
 */
export function StudioGraph({
    graph,
    readinessByKey,
    proposals,
    selectedKey,
    onSelectKey,
    onConnectNodes
}: StudioGraphProps) {
    const liveKeys = useMemo(
        () => new Set(graph.competencies.map(competency => competency.key)),
        [graph.competencies]
    );

    // Proposals whose key is already live are approvals of an existing node rather than new
    // nodes; drawing them twice would double the graph.
    const proposedNodes = useMemo(
        () => proposals.competencies.filter(proposal => !liveKeys.has(proposal.key)),
        [proposals.competencies, liveKeys]
    );

    const shape = useMemo<GraphShape>(() => {
        const nodes = [
            ...graph.competencies.map(competency => ({ key: competency.key })),
            ...proposedNodes.map(proposal => ({ key: proposal.key }))
        ];
        const known = new Set(nodes.map(node => node.key));
        const edges = [
            ...graph.edges.map(edge => ({ from: edge.fromKey, to: edge.toKey })),
            ...proposals.edges.map(edge => ({ from: edge.fromKey, to: edge.toKey }))
        ].filter(edge => known.has(edge.from) && known.has(edge.to));
        return { nodes, edges };
    }, [graph, proposedNodes, proposals.edges]);

    const nodes = useMemo(() => {
        const live = graph.competencies.map(competency => ({
            id: competency.key,
            data: {
                competency,
                authoringState: authoringStateFor(competency.key, readinessByKey),
                selected: competency.key === selectedKey,
                isProposal: false
            },
            ariaLabel: `${competency.label}, ${competency.kind.toLowerCase()}`
        }));
        const proposed = proposedNodes.map(proposal => ({
            id: proposal.key,
            data: {
                competency: proposalAsCompetency(proposal),
                authoringState: 'PROPOSED' as const,
                selected: proposal.key === selectedKey,
                isProposal: true
            },
            ariaLabel: `${proposal.label}, proposed ${proposal.kind.toLowerCase()}`
        }));
        return [...live, ...proposed];
    }, [graph.competencies, proposedNodes, readinessByKey, selectedKey]);

    const edges = useMemo<DiagramCanvasEdge[]>(() => {
        const live = graph.edges.map(edge => ({
            id: `${edge.fromKey}->${edge.toKey}`,
            from: edge.fromKey,
            to: edge.toKey,
            // A RELATED edge gates nothing, so it must not read like a prerequisite.
            dashed: edge.kind === 'RELATED'
        }));
        const proposed = proposals.edges.map(edge => ({
            id: `proposed:${edge.fromKey}->${edge.toKey}`,
            from: edge.fromKey,
            to: edge.toKey,
            ghost: true
        }));
        return [...live, ...proposed];
    }, [graph.edges, proposals.edges]);

    return (
        <DiagramCanvas
            shape={shape}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodeType="studioCompetency"
            selectedId={selectedKey}
            onSelect={onSelectKey}
            onConnectNodes={onConnectNodes}
            ariaLabel="Competency graph editor"
            testId="studio-graph"
        />
    );
}
