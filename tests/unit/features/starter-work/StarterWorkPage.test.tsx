import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarterWorkPage } from '../../../../src/pages/StarterWorkPage';
import { starterWorkService } from '../../../../src/services/starterWorkService';
import type { StarterWorkTask } from '../../../../src/features/starter-work/types';

const permissionGroup = vi.hoisted(() => ({ current: 'PM' }));

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'u1', permissionGroup: permissionGroup.current } })
}));

const task: StarterWorkTask = {
    id: 'task-1',
    sourceId: 'github:acme/repo:ISSUE:42',
    title: 'Fix the login redirect',
    summary: 'Users land on the wrong page after signing in.',
    rationale: 'Touches one file and has clear acceptance criteria.',
    sourceUrl: 'https://github.com/acme/repo/issues/42',
    competencyKeys: ['kotlin', 'auth'],
    status: 'PROPOSED'
};

describe('StarterWorkPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        permissionGroup.current = 'PM';
        vi.spyOn(starterWorkService, 'fetchProposed').mockResolvedValue({ tasks: [task] });
    });

    it('shows the AI scope-safety rationale next to the task', async () => {
        render(<StarterWorkPage />);

        // The rationale is the claim a PM is checking, so it has to be visible before deciding.
        expect(
            await screen.findByText(/touches one file and has clear acceptance criteria/i)
        ).toBeInTheDocument();
        expect(screen.getByText('Fix the login redirect')).toBeInTheDocument();
    });

    it('lists the competencies that become prerequisites', async () => {
        render(<StarterWorkPage />);

        await screen.findByText('Fix the login redirect');
        expect(screen.getByText('kotlin')).toBeInTheDocument();
        expect(screen.getByText('auth')).toBeInTheDocument();
    });

    it('states that approving puts the task in front of hires', async () => {
        render(<StarterWorkPage />);

        await screen.findByText('Fix the login redirect');
        expect(screen.getByText(/adds this to the graph as a goal/i)).toBeInTheDocument();
    });

    it('approves through the service and drops the task from the queue', async () => {
        const user = userEvent.setup();
        const approve = vi
            .spyOn(starterWorkService, 'approve')
            .mockResolvedValue({ ...task, status: 'APPROVED' });
        render(<StarterWorkPage />);

        await user.click(await screen.findByTestId('approve-task-task-1'));

        await waitFor(() => expect(approve).toHaveBeenCalledWith('task-1'));
        await waitFor(() =>
            expect(screen.queryByText('Fix the login redirect')).not.toBeInTheDocument()
        );
    });

    it('lets HR read the queue but not decide on it', async () => {
        permissionGroup.current = 'HR';
        render(<StarterWorkPage />);

        expect(await screen.findByText('Fix the login redirect')).toBeInTheDocument();
        expect(screen.queryByTestId('approve-task-task-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('reject-task-task-1')).not.toBeInTheDocument();
    });

    it('explains the empty queue rather than showing a blank page', async () => {
        vi.spyOn(starterWorkService, 'fetchProposed').mockResolvedValue({ tasks: [] });
        render(<StarterWorkPage />);

        expect(await screen.findByText(/nothing waiting for review/i)).toBeInTheDocument();
    });

    it('surfaces a failed load', async () => {
        vi.spyOn(starterWorkService, 'fetchProposed').mockRejectedValue(new Error('boom'));
        render(<StarterWorkPage />);

        expect(await screen.findByText('boom')).toBeInTheDocument();
    });
});
