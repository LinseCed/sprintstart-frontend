import { describe, it, expect } from 'vitest';
import { normalizeInbox, taskItems } from '../../../../src/features/review-inbox/normalize';
import type { ProposedStarterWork } from '../../../../src/features/starter-work/types';

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
            status: 'LIVE', reviewed: false,
        },
    ],
};

describe('review-inbox normalize', () => {
    it('tags a task with its skill count', () => {
        const [item] = taskItems(tasks);
        expect(item).toMatchObject({ id: 't1', kind: 'task', title: 'Fix the flaky test', tag: '2 skills' });
    });

    it('turns the queue into one flat list of cards', () => {
        const items = normalizeInbox({ tasks });
        expect(items.map((item) => item.kind)).toEqual(['task']);
    });
});
