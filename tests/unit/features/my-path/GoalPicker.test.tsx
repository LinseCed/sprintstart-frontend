import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GoalPicker } from '../../../../src/features/my-path/components/GoalPicker';
import type { PathGoal, RankedStarterWorkTask } from '../../../../src/features/starter-work/types';

const match: RankedStarterWorkTask = {
    task: {
        id: 'task-1',
        sourceId: 'github:acme/repo:ISSUE:42',
        title: 'Fix the login redirect',
        summary: 'Users land on the wrong page after signing in.',
        rationale: null,
        sourceUrl: 'https://github.com/acme/repo/issues/42',
        competencyKeys: ['kotlin', 'auth'],
        status: 'APPROVED'
    },
    score: 40,
    matchedCompetencyKeys: ['kotlin'],
    taskType: 'BUG',
    reasons: ['uses kotlin, which you have already shown']
};

const currentGoal: PathGoal = {
    competencyKey: 'github-acme-repo-issue-42',
    label: 'Fix the login redirect',
    summary: null,
    sourceUrl: null,
    sourceProposalId: 'task-1',
    remainingCount: 1,
    isReachable: false
};

function renderPicker(overrides: Partial<React.ComponentProps<typeof GoalPicker>> = {}) {
    const props = {
        matches: [match],
        currentGoal: null,
        isLoading: false,
        isClaiming: false,
        error: null,
        onLoad: vi.fn(),
        onClaim: vi.fn().mockResolvedValue(true),
        onClear: vi.fn().mockResolvedValue(true),
        onClose: vi.fn(),
        ...overrides
    };
    render(<GoalPicker {...props} />);
    return props;
}

describe('GoalPicker', () => {
    it('gives a reason for the ranking rather than a bare score', () => {
        renderPicker();

        // 0.82 means nothing to a person; "you already have kotlin" does.
        expect(screen.getByText(/builds on what you already have/i)).toBeInTheDocument();
        expect(screen.getByText('kotlin')).toBeInTheDocument();
        expect(screen.queryByText(/0\.82/)).not.toBeInTheDocument();
    });

    it('says the choice is reversible and costs nothing', () => {
        renderPicker();

        expect(screen.getByText(/takes nothing away/i)).toBeInTheDocument();
    });

    it('claims a task and closes', async () => {
        const user = userEvent.setup();
        const props = renderPicker();

        await user.click(screen.getByTestId('claim-goal-task-1'));

        await waitFor(() => expect(props.onClaim).toHaveBeenCalledWith('task-1'));
        await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    });

    it('marks the current goal instead of offering to claim it again', () => {
        renderPicker({ currentGoal });

        expect(screen.getByText(/this is what you.re working toward/i)).toBeInTheDocument();
        expect(screen.queryByTestId('claim-goal-task-1')).not.toBeInTheDocument();
    });

    it('offers to stop only when a goal is set', () => {
        renderPicker();
        expect(screen.queryByTestId('clear-goal')).not.toBeInTheDocument();
    });

    it('distinguishes an empty pool from a failure, and says whose job it is', () => {
        renderPicker({ matches: [] });

        // Nothing approved yet is a PM gap, not something the hire can fix by retrying.
        expect(screen.getByText(/your team lead approves these/i)).toBeInTheDocument();
    });

    it('surfaces a claim failure in place', () => {
        renderPicker({ error: 'Starter-work task is PROPOSED' });

        expect(screen.getByText(/starter-work task is proposed/i)).toBeInTheDocument();
    });
});
