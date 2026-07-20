import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudioGraph } from '../../../../src/features/graph-authoring/components/StudioGraph';
import type {
    LiveCompetency,
    LiveGraph,
    ProposedGraph
} from '../../../../src/features/graph-authoring/types';
import type { ModuleReadiness } from '../../../../src/features/graph-authoring/hooks/useModuleAuthoring';

function competency(key: string): LiveCompetency {
    return {
        key,
        label: key,
        description: null,
        kind: 'SKILL',
        targetLevel: 2,
        invariant: false,
        repoRef: null
    };
}

const graph: LiveGraph = {
    competencies: [competency('published'), competency('drafting'), competency('empty')],
    edges: [{ fromKey: 'published', toKey: 'drafting', kind: 'PREREQUISITE' }],
    graphVersion: 2
};

const readiness = new Map<string, ModuleReadiness>([
    ['published', { activeModuleId: 'm1', pending: null }],
    ['drafting', { activeModuleId: null, pending: { moduleId: 'm2', status: 'DRAFT' } }]
]);

const noProposals: ProposedGraph = { competencies: [], edges: [] };

function renderGraph(proposals: ProposedGraph = noProposals) {
    render(
        <StudioGraph
            graph={graph}
            readinessByKey={readiness}
            proposals={proposals}
            selectedKey={null}
            onSelectKey={vi.fn()}
            onConnectNodes={vi.fn()}
        />
    );
}

describe('StudioGraph', () => {
    it('shows each node by whether it has been authored, not by anyone’s progress', () => {
        renderGraph();

        expect(screen.getByTestId('studio-node-published')).toHaveAttribute(
            'data-authoring-state',
            'PUBLISHED'
        );
        expect(screen.getByTestId('studio-node-drafting')).toHaveAttribute(
            'data-authoring-state',
            'PENDING'
        );
        // The state that matters: a node a hire can reach and find nothing behind.
        expect(screen.getByTestId('studio-node-empty')).toHaveAttribute(
            'data-authoring-state',
            'EMPTY'
        );
    });

    it('draws proposed nodes alongside the live graph, so they are reviewed in context', () => {
        renderGraph({
            competencies: [
                {
                    id: 'p1',
                    key: 'proposed-one',
                    label: 'Proposed one',
                    description: null,
                    kind: 'CONCEPT',
                    repoRef: null,
                    status: 'PROPOSED'
                }
            ],
            edges: []
        });

        expect(screen.getByTestId('studio-node-proposed-one')).toHaveAttribute(
            'data-authoring-state',
            'PROPOSED'
        );
    });

    it('does not draw a proposal whose key is already live twice', () => {
        renderGraph({
            competencies: [
                {
                    id: 'p2',
                    key: 'published',
                    label: 'Published',
                    description: null,
                    kind: 'SKILL',
                    repoRef: null,
                    status: 'PROPOSED'
                }
            ],
            edges: []
        });

        expect(screen.getAllByTestId('studio-node-published')).toHaveLength(1);
        expect(screen.getByTestId('studio-node-published')).toHaveAttribute(
            'data-authoring-state',
            'PUBLISHED'
        );
    });
});
