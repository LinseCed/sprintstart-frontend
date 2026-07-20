import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GoalBanner } from '../../../../src/features/my-path/components/GoalBanner';
import type { PathGoal } from '../../../../src/features/starter-work/types';

const goal: PathGoal = {
    competencyKey: 'github-acme-repo-issue-42',
    label: 'Fix the login redirect',
    summary: 'A small, well-scoped bug',
    sourceUrl: 'https://github.com/acme/repo/issues/42',
    sourceProposalId: 'proposal-1',
    remainingCount: 2,
    isReachable: false
};

describe('GoalBanner', () => {
    describe('with no goal claimed', () => {
        it('is an explicit state with a next action, not an empty space', () => {
            render(
                <GoalBanner goal={null} onFocusGoal={vi.fn()} onChooseGoal={vi.fn()} />
            );

            expect(screen.getByTestId('goal-banner-empty')).toBeInTheDocument();
            expect(screen.getByTestId('choose-goal')).toBeInTheDocument();
        });

        it('explains that the path is still meaningful without a goal', () => {
            render(
                <GoalBanner goal={null} onFocusGoal={vi.fn()} onChooseGoal={vi.fn()} />
            );

            // "No goal" must not read as "your path is broken" -- the baseline is still real work.
            expect(screen.getByText(/what the team expects of everyone/i)).toBeInTheDocument();
        });

        it('opens the picker', async () => {
            const user = userEvent.setup();
            const onChooseGoal = vi.fn();
            render(
                <GoalBanner goal={null} onFocusGoal={vi.fn()} onChooseGoal={onChooseGoal} />
            );

            await user.click(screen.getByTestId('choose-goal'));

            expect(onChooseGoal).toHaveBeenCalled();
        });
    });

    describe('with a goal claimed', () => {
        it('names the destination and counts progress toward it', () => {
            render(<GoalBanner goal={goal} onFocusGoal={vi.fn()} onChooseGoal={vi.fn()} />);

            expect(screen.getByTestId('goal-banner')).toBeInTheDocument();
            expect(screen.getByText('Fix the login redirect')).toBeInTheDocument();
            // Toward the goal, from the payload -- not "n of m nodes across the graph".
            expect(screen.getByText(/2 steps to go/i)).toBeInTheDocument();
        });

        it('says the goal is ready once its prerequisites are cleared', () => {
            render(
                <GoalBanner
                    goal={{ ...goal, remainingCount: 0, isReachable: true }}
                    onFocusGoal={vi.fn()}
                    onChooseGoal={vi.fn()}
                />
            );

            expect(screen.getByText(/ready to start/i)).toBeInTheDocument();
        });

        it('singularises a single remaining step', () => {
            render(
                <GoalBanner
                    goal={{ ...goal, remainingCount: 1 }}
                    onFocusGoal={vi.fn()}
                    onChooseGoal={vi.fn()}
                />
            );

            expect(screen.getByText(/1 step to go/i)).toBeInTheDocument();
        });

        it('links to the underlying task', () => {
            render(<GoalBanner goal={goal} onFocusGoal={vi.fn()} onChooseGoal={vi.fn()} />);

            expect(screen.getByRole('link', { name: /the task/i })).toHaveAttribute(
                'href',
                'https://github.com/acme/repo/issues/42'
            );
        });

        it('focuses the goal node on the graph when its name is clicked', async () => {
            const user = userEvent.setup();
            const onFocusGoal = vi.fn();
            render(<GoalBanner goal={goal} onFocusGoal={onFocusGoal} onChooseGoal={vi.fn()} />);

            await user.click(screen.getByTestId('focus-goal'));

            expect(onFocusGoal).toHaveBeenCalledWith('github-acme-repo-issue-42');
        });
    });
});
