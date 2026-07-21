import type { ProposedGraph } from '../graph-authoring/types';
import type { ProposedBlueprints } from '../blueprint-authoring/types';
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

/**
 * Baseline entries across every proposed scope. The id is the `proposalId` the per-competency
 * approve/reject endpoint targets, not the semantic competency key. The rationale is preferred over
 * the requirement because a PM approving a mandate for everyone needs the argument, not the rule.
 */
export function baselineItems(proposed: ProposedBlueprints): ReviewItemView[] {
    return proposed.blueprints.flatMap((blueprint) =>
        blueprint.competencies.map((competency) => ({
            id: competency.proposalId,
            kind: 'baseline',
            title: competency.label,
            detail: competency.rationale ?? competency.requirement,
            tag: `L${competency.targetLevel}`,
        })),
    );
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

/** Every pending proposal, from all three queues, as one flat list of uniform cards. */
export function normalizeInbox(input: {
    graph: ProposedGraph;
    baseline: ProposedBlueprints;
    tasks: ProposedStarterWork;
}): ReviewItemView[] {
    return [...graphItems(input.graph), ...baselineItems(input.baseline), ...taskItems(input.tasks)];
}
