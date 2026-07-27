import { describe, it, expect } from 'vitest';
import {
    baselineItems,
    graphItems,
    normalizeInbox,
    taskItems,
} from '../../../../src/features/review-inbox/normalize';
import type { ProposedGraph } from '../../../../src/features/graph-authoring/types';
import type { ProposedBlueprints } from '../../../../src/features/blueprint-authoring/types';
import type { ProposedStarterWork } from '../../../../src/features/starter-work/types';

const graph: ProposedGraph = {
    competencies: [
        { id: 'c1', key: 'python', label: 'Python', description: 'The language.', kind: 'SKILL', repoRef: null, status: 'PROPOSED' },
    ],
    edges: [
        { id: 'e1', fromKey: 'python', toKey: 'docker', kind: 'PREREQUISITE', rationale: 'Need it first.', status: 'PROPOSED' },
    ],
};

const baseline: ProposedBlueprints = {
    blueprints: [
        {
            scope: 'global',
            version: 'v1',
            competencies: [
                {
                    competencyKey: 'python',
                    label: 'Python',
                    description: 'The language.',
                    targetLevel: 2,
                    targetLevelOverridden: false,
                    requirement: 'Reach level 2.',
                    invariant: false,
                    rationale: 'Everything here is Python.',
                    proposalId: 'b1',
                    status: 'PROPOSED',
                },
            ],
        },
    ],
};

const tasks: ProposedStarterWork = {
    tasks: [
        {
            id: 't1',
            sourceId: 's1',
            title: 'Fix the flaky test',
            summary: 'A small, safe first task.',
            rationale: 'Well scoped.',
            onboardingTrackKey: null,
            sourceUrl: null,
            competencyKeys: ['python', 'testing'],
            status: 'PROPOSED',
        },
    ],
};

describe('review-inbox normalize', () => {
    it('turns competencies and edges into cards, edges labelled by their endpoints', () => {
        const items = graphItems(graph);
        expect(items).toHaveLength(2);
        expect(items[0]).toMatchObject({ id: 'c1', kind: 'competency', title: 'Python', tag: 'SKILL' });
        expect(items[1]).toMatchObject({ id: 'e1', kind: 'edge', title: 'python → docker', tag: 'PREREQUISITE' });
    });

    it('keys a baseline card by its proposalId and prefers the rationale', () => {
        const [item] = baselineItems(baseline);
        expect(item.id).toBe('b1');
        expect(item.kind).toBe('baseline');
        expect(item.detail).toBe('Everything here is Python.');
        expect(item.tag).toBe('L2');
    });

    it('tags a task with its skill count', () => {
        const [item] = taskItems(tasks);
        expect(item).toMatchObject({ id: 't1', kind: 'task', title: 'Fix the flaky test', tag: '2 skills' });
    });

    it('merges all three queues into one flat list', () => {
        const items = normalizeInbox({ graph, baseline, tasks });
        expect(items.map((item) => item.kind)).toEqual(['competency', 'edge', 'baseline', 'task']);
    });
});
