import { describe, it, expect } from 'vitest';
import { graphItems, normalizeInbox, taskItems } from '../../../../src/features/review-inbox/normalize';
import type { ProposedGraph } from '../../../../src/features/graph-authoring/types';
import type { ProposedStarterWork } from '../../../../src/features/starter-work/types';

const graph: ProposedGraph = {
    competencies: [
        { id: 'c1', key: 'python', label: 'Python', description: 'The language.', kind: 'SKILL', repoRef: null, status: 'PROPOSED' },
    ],
    edges: [
        { id: 'e1', fromKey: 'python', toKey: 'docker', kind: 'PREREQUISITE', rationale: 'Need it first.', status: 'PROPOSED' },
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

    it('tags a task with its skill count', () => {
        const [item] = taskItems(tasks);
        expect(item).toMatchObject({ id: 't1', kind: 'task', title: 'Fix the flaky test', tag: '2 skills' });
    });

    it('merges both queues into one flat list', () => {
        const items = normalizeInbox({ graph, tasks });
        expect(items.map((item) => item.kind)).toEqual(['competency', 'edge', 'task']);
    });
});
