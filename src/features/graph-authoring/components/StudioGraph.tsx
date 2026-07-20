import { useCallback, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    type Connection,
    type Edge,
    type NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { chainFor, type GraphShape } from '../../competency-graph/layout';
import { useForceLayout } from '../../competency-graph/useForceLayout';
import { StudioGraphNode, type AuthoringState, type StudioFlowNode } from './StudioGraphNode';
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
 * Two things separate it from the hire's map. Nodes are coloured by **authoring readiness** —
 * whether a module is published, drafted or missing — because "mastered/available/locked"
 * describes a person's progress and means nothing on the shared graph. And proposals are drawn
 * as dashed ghosts wired into the live nodes they connect to, rather than sitting in a list
 * beside a picture of the graph.
 *
 * The layout engine is shared with the hire's map (`features/competency-graph`), so the two
 * surfaces can never disagree about where a node sits.
 */
export function StudioGraph({
    graph,
    readinessByKey,
    proposals,
    selectedKey,
    onSelectKey,
    onConnectNodes
}: StudioGraphProps) {
    const reduceMotion = useReducedMotion() ?? false;
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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

    const { positions } = useForceLayout(shape, !reduceMotion);

    // Hover is pointer-only, so selection lights the same chain — otherwise this reading of the
    // graph is unavailable by keyboard.
    const chainKey = hoveredKey ?? selectedKey;
    const chainKeys = useMemo(
        () => (chainKey ? chainFor(shape, chainKey) : null),
        [shape, chainKey]
    );

    const nodes = useMemo<StudioFlowNode[]>(() => {
        const live = graph.competencies.map(competency => ({
            id: competency.key,
            type: 'studioCompetency' as const,
            position: positions.get(competency.key) ?? { x: 0, y: 0 },
            data: {
                competency,
                authoringState: authoringStateFor(competency.key, readinessByKey),
                selected: competency.key === selectedKey,
                dimmed: chainKeys !== null && !chainKeys.has(competency.key),
                isProposal: false
            },
            ariaLabel: `${competency.label}, ${competency.kind.toLowerCase()}`
        }));
        const proposed = proposedNodes.map(proposal => ({
            id: proposal.key,
            type: 'studioCompetency' as const,
            position: positions.get(proposal.key) ?? { x: 0, y: 0 },
            data: {
                competency: proposalAsCompetency(proposal),
                authoringState: 'PROPOSED' as const,
                selected: proposal.key === selectedKey,
                dimmed: chainKeys !== null && !chainKeys.has(proposal.key),
                isProposal: true
            },
            ariaLabel: `${proposal.label}, proposed ${proposal.kind.toLowerCase()}`
        }));
        return [...live, ...proposed];
    }, [graph.competencies, proposedNodes, positions, readinessByKey, selectedKey, chainKeys]);

    const edges = useMemo<Edge[]>(() => {
        const known = new Set(nodes.map(node => node.id));
        const live = graph.edges
            .filter(edge => known.has(edge.fromKey) && known.has(edge.toKey))
            .map(edge => ({
                id: `${edge.fromKey}->${edge.toKey}`,
                source: edge.fromKey,
                target: edge.toKey,
                markerEnd: { type: MarkerType.ArrowClosed },
                // A RELATED edge gates nothing, so it must not read like a prerequisite.
                style: {
                    opacity:
                        chainKeys === null ||
                        (chainKeys.has(edge.fromKey) && chainKeys.has(edge.toKey))
                            ? 1
                            : 0.12,
                    strokeDasharray: edge.kind === 'RELATED' ? '2 4' : undefined
                }
            }));
        const proposed = proposals.edges
            .filter(edge => known.has(edge.fromKey) && known.has(edge.toKey))
            .map(edge => ({
                id: `proposed:${edge.fromKey}->${edge.toKey}`,
                source: edge.fromKey,
                target: edge.toKey,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { opacity: 0.6, strokeDasharray: '6 4' }
            }));
        return [...live, ...proposed];
    }, [graph.edges, proposals.edges, nodes, chainKeys]);

    const handleNodeClick = useCallback<NodeMouseHandler<StudioFlowNode>>(
        (_event, node) => onSelectKey(node.id),
        [onSelectKey]
    );

    const handleConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            onConnectNodes(connection.source, connection.target);
        },
        [onConnectNodes]
    );

    return (
        <div
            className="h-full w-full"
            data-testid="studio-graph"
            role="application"
            aria-label="Competency graph editor"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                onNodeMouseEnter={(_event, node) => setHoveredKey(node.id)}
                onNodeMouseLeave={() => setHoveredKey(null)}
                onPaneClick={() => onSelectKey(null)}
                onConnect={handleConnect}
                // Positions are derived from the layout on every render, so a dragged node would
                // be pulled back under the pointer. Prerequisites are declared by dragging
                // between the connection handles instead.
                nodesDraggable={false}
                nodesConnectable
                edgesFocusable={false}
                fitView
                proOptions={{ hideAttribution: false }}
            >
                <Background />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
