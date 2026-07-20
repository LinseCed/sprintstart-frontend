import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    forceCollide,
    forceLink,
    forceSimulation,
    forceX,
    forceY,
    type Simulation
} from 'd3-force';
import { NODE_HEIGHT, NODE_WIDTH, layoutPath, type NodePosition } from '../graphLayout';
import type { PathView } from '../../skill-assessment/types';

/**
 * Above this many nodes the simulation is skipped and dagre's positions are used
 * as-is. A force pass that stutters on a real graph is worse than no force pass,
 * and the value here is feel -- it is never load-bearing for reading the graph.
 */
const MAX_SIMULATED_NODES = 400;

/** Pins a node to its dagre column, so the left-to-right tier order never drifts. */
const TIER_STRENGTH = 0.9;
/** Weak, so links and collision can shuffle a node within its tier. */
const ROW_STRENGTH = 0.06;
const LINK_STRENGTH = 0.04;

type SimNode = {
    id: string;
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    homeX: number;
    homeY: number;
};

type SimLink = { source: string; target: string };

export type ForceLayout = {
    /** Current position per competency key, in React Flow's top-left coordinates. */
    positions: Map<string, NodePosition>;
    /** Whether nodes should be draggable -- false when the simulation is off. */
    isLive: boolean;
    onDragStart: (key: string, position: NodePosition) => void;
    onDrag: (key: string, position: NodePosition) => void;
    onDragStop: (key: string) => void;
};

/**
 * Adds a light physics layer on top of the dagre layout.
 *
 * Dagre still owns the structure: `forceX` pins every node hard to its dagre
 * column, so the left-to-right "prerequisites flow into what they unlock"
 * reading and the tier order stay deterministic. The simulation only relaxes
 * what dagre leaves rigid -- collision so cards never overlap, and weak link
 * springs so dragging a node tugs its neighbours and lets go.
 *
 * The simulation is seeded from dagre and stops on its own once it settles;
 * dragging restarts it and releasing lets the node spring home. With reduced
 * motion, or past {@link MAX_SIMULATED_NODES}, nothing runs and the dagre
 * positions are returned unchanged -- the graph is then exactly what it was
 * before, which is the point: this is polish, never a dependency.
 *
 * @param path The projected graph. A change in its shape reseeds the simulation.
 * @param enabled False for reduced motion; skips the simulation entirely.
 */
export function useForceLayout(path: PathView, enabled: boolean): ForceLayout {
    const seeded = useMemo(() => layoutPath(path), [path]);
    const isLive = enabled && path.nodes.length <= MAX_SIMULATED_NODES;

    // Simulated positions only; `seeded` fills any key the simulation hasn't
    // reported yet, so a graph that just changed shape never renders at the origin.
    const [simulated, setSimulated] = useState<Map<string, NodePosition>>(new Map());
    const simulationRef = useRef<Simulation<SimNode, undefined> | null>(null);
    const nodesRef = useRef<Map<string, SimNode>>(new Map());

    useEffect(() => {
        if (!isLive) {
            simulationRef.current?.stop();
            simulationRef.current = null;
            nodesRef.current = new Map();
            return;
        }

        // d3 works from node centres; dagre positions were already converted to
        // top-left corners for React Flow, so convert back on the way in and out.
        const simNodes: SimNode[] = path.nodes.map(node => {
            const seed = seeded.get(node.key) ?? { x: 0, y: 0 };
            const centreX = seed.x + NODE_WIDTH / 2;
            const centreY = seed.y + NODE_HEIGHT / 2;
            return { id: node.key, x: centreX, y: centreY, homeX: centreX, homeY: centreY };
        });
        const byId = new Map(simNodes.map(node => [node.id, node]));
        const links: SimLink[] = path.edges
            .filter(edge => byId.has(edge.from) && byId.has(edge.to))
            .map(edge => ({ source: edge.from, target: edge.to }));

        const simulation = forceSimulation(simNodes)
            .force('tier', forceX<SimNode>(node => node.homeX).strength(TIER_STRENGTH))
            .force('row', forceY<SimNode>(node => node.homeY).strength(ROW_STRENGTH))
            .force(
                'collide',
                // The cards are wide rectangles; a radius from the diagonal would
                // push them much further apart vertically than they need.
                forceCollide<SimNode>(NODE_HEIGHT * 0.75).strength(0.9)
            )
            .force(
                'link',
                forceLink<SimNode, SimLink>(links)
                    .id(node => node.id)
                    .distance(NODE_WIDTH)
                    .strength(LINK_STRENGTH)
            )
            .on('tick', () => {
                const next = new Map<string, NodePosition>();
                for (const node of simNodes) {
                    next.set(node.id, {
                        x: node.x - NODE_WIDTH / 2,
                        y: node.y - NODE_HEIGHT / 2
                    });
                }
                setSimulated(next);
            });

        simulationRef.current = simulation;
        nodesRef.current = byId;

        return () => {
            simulation.stop();
            simulationRef.current = null;
        };
    }, [path, seeded, isLive]);

    const onDragStart = useCallback((key: string, position: NodePosition) => {
        const node = nodesRef.current.get(key);
        if (!node) return;
        node.fx = position.x + NODE_WIDTH / 2;
        node.fy = position.y + NODE_HEIGHT / 2;
        simulationRef.current?.alphaTarget(0.3).restart();
    }, []);

    const onDrag = useCallback((key: string, position: NodePosition) => {
        const node = nodesRef.current.get(key);
        if (!node) return;
        node.fx = position.x + NODE_WIDTH / 2;
        node.fy = position.y + NODE_HEIGHT / 2;
    }, []);

    // Releasing clears the pin rather than freezing the node where it was
    // dropped: `forceX`/`forceY` then pull it back to its dagre home, so a drag
    // is a way to peek at the structure, not a way to rearrange it.
    const onDragStop = useCallback((key: string) => {
        const node = nodesRef.current.get(key);
        if (node) {
            node.fx = null;
            node.fy = null;
        }
        simulationRef.current?.alphaTarget(0).alpha(0.3).restart();
    }, []);

    const positions = useMemo(() => {
        if (!isLive) return seeded;
        const merged = new Map(seeded);
        for (const [key, position] of simulated) {
            if (merged.has(key)) merged.set(key, position);
        }
        return merged;
    }, [isLive, seeded, simulated]);

    return { positions, isLive, onDragStart, onDrag, onDragStop };
}
