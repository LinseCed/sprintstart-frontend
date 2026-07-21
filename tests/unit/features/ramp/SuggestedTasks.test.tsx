import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SuggestedTasks } from '../../../../src/features/ramp/components/SuggestedTasks';
import type { RankedStarterWorkTask } from '../../../../src/features/starter-work/types';

function match(overrides: Partial<RankedStarterWorkTask> = {}): RankedStarterWorkTask {
    return {
        task: {
            id: 'task-1',
            sourceId: 'github:acme/api:ISSUE:42',
            title: 'Fix the login redirect',
            summary: null,
            rationale: null,
            sourceUrl: 'https://github.com/acme/api/issues/42',
            competencyKeys: ['kotlin'],
            status: 'APPROVED'
        },
        score: 60,
        matchedCompetencyKeys: ['kotlin'],
        taskType: 'BUG',
        reasons: ['uses kotlin, which you have already shown'],
        ...overrides
    };
}

describe('SuggestedTasks', () => {
    it('states why a task was suggested and never shows the score', () => {
        render(
            <SuggestedTasks
                matches={[match()]}
                isLoading={false}
                error={null}
                claimingId={null}
                onPick={vi.fn()}
            />
        );

        expect(
            screen.getByText(/Suggested because it uses kotlin, which you have already shown/)
        ).toBeInTheDocument();
        // A number is not a reason, and showing one makes the top row read as an instruction.
        expect(screen.queryByText('60')).not.toBeInTheDocument();
    });

    it('shows a responsiveness note alongside the positive reasons', () => {
        render(
            <SuggestedTasks
                matches={[
                    match({
                        reasons: [
                            'uses kotlin, which you have already shown',
                            'note: reviews here take about 200 hours to arrive'
                        ]
                    })
                ]}
                isLoading={false}
                error={null}
                claimingId={null}
                onPick={vi.fn()}
            />
        );

        expect(screen.getByText(/reviews here take about 200 hours/)).toBeInTheDocument();
    });

    it('says plainly when nothing matched instead of inventing a reason', () => {
        render(
            <SuggestedTasks
                matches={[match({ reasons: [], matchedCompetencyKeys: [] })]}
                isLoading={false}
                error={null}
                claimingId={null}
                onPick={vi.fn()}
            />
        );

        expect(screen.getByText(/simply open/)).toBeInTheDocument();
    });

    it('lets any task be picked, not just the top one', async () => {
        const onPick = vi.fn();
        render(
            <SuggestedTasks
                matches={[
                    match(),
                    match({ task: { ...match().task, id: 'task-2', title: 'Second option' } })
                ]}
                isLoading={false}
                error={null}
                claimingId={null}
                onPick={onPick}
            />
        );

        const buttons = screen.getAllByRole('button', { name: /Work on this/ });
        expect(buttons).toHaveLength(2);
        await userEvent.click(buttons[1]);
        expect(onPick).toHaveBeenCalledWith('task-2');
    });

    it('an empty pool is a gap in the pool, not the hire missing something', () => {
        render(
            <SuggestedTasks
                matches={[]}
                isLoading={false}
                error={null}
                claimingId={null}
                onPick={vi.fn()}
            />
        );

        expect(screen.getByText(/isn't something you're missing/)).toBeInTheDocument();
    });
});
