import type { ProposedStarterWork } from '../starter-work/types';
import type { ReviewItemView } from './types';

/** Mined starter tasks, as review cards. */
export function taskItems(proposed: ProposedStarterWork): ReviewItemView[] {
    return proposed.tasks.map((task) => {
        const skills = task.competencyKeys.length;
        return {
            id: task.id,
            kind: 'task',
            title: task.title,
            detail: task.summary ?? task.rationale,
            tag: skills > 0 ? `${skills} skill${skills === 1 ? '' : 's'}` : null,
        };
    });
}

/** Every pending proposal as one flat list of uniform cards. */
export function normalizeInbox(input: { tasks: ProposedStarterWork }): ReviewItemView[] {
    return taskItems(input.tasks);
}
