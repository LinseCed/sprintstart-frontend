import type { ProposedGraph } from '../graph-authoring/types';
import type { ProposedStarterWork } from '../starter-work/types';
import type { ReviewItemView } from './types';

/** Competencies and edges from the skill-map generator, as review cards. */
export function graphItems(proposed: ProposedGraph): ReviewItemView[] {
    const competencies: ReviewItemView[] = proposed.competencies.map((competency) => ({
        id: competency.id,
        kind: 'competency',
        title: competency.label,
        detail: competency.description,
        tag: competency.kind,
    }));
    const edges: ReviewItemView[] = proposed.edges.map((edge) => ({
        id: edge.id,
        kind: 'edge',
        title: `${edge.fromKey} → ${edge.toKey}`,
        detail: edge.rationale,
        tag: edge.kind,
    }));
    return [...competencies, ...edges];
}

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

/** Every pending proposal, from both queues, as one flat list of uniform cards. */
export function normalizeInbox(input: {
    graph: ProposedGraph;
    tasks: ProposedStarterWork;
}): ReviewItemView[] {
    return [...graphItems(input.graph), ...taskItems(input.tasks)];
}
