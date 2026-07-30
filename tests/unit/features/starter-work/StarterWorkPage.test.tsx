import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarterWorkPage } from '../../../../src/pages/StarterWorkPage';
import { starterWorkService } from '../../../../src/services/starterWorkService';
import { userService } from '../../../../src/services/userService';
import type { StarterWorkTask } from '../../../../src/features/starter-work/types';

vi.mock('../../../../src/features/projects/useProjectContext', async () => {
    const { createProjectContextValue, createSelectableProject } = await import(
        '../../setup/projectContext'
    );
    return {
        useProjectContext: () =>
            createProjectContextValue({
                selectedProjectId: 'p1',
                projects: [createSelectableProject({ id: 'p1', name: 'Project One' })],
                selectedProject: createSelectableProject({ id: 'p1', name: 'Project One' }),
            }),
    };
});

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
    onboardingTrackKey: null,
    sourceUrl: 'https://github.com/acme/repo/issues/42',
    competencyKeys: ['kotlin', 'auth'],
    status: 'PROPOSED'
};

describe('StarterWorkPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        permissionGroup.current = 'PM';
        vi.spyOn(starterWorkService, 'fetchProposed').mockResolvedValue({ tasks: [task] });
        // The PM page also renders the task-orientation manager, which loads the approved pool and
        // the caller's projects. Stub both so these tests stay about the review queue.
        vi.spyOn(starterWorkService, 'fetchApproved').mockResolvedValue([]);
        vi.spyOn(userService, 'getMyProjects').mockResolvedValue([]);
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

    it('hand-authors a task through the service and confirms it skipped review', async () => {
        const user = userEvent.setup();
        const create = vi.spyOn(starterWorkService, 'create').mockResolvedValue({
            ...task,
            id: 'authored-1',
            title: 'Add a dark-mode toggle',
            status: 'APPROVED'
        });
        render(<StarterWorkPage />);

        await user.click(await screen.findByTestId('add-starter-task'));
        await user.type(screen.getByLabelText('Title'), 'Add a dark-mode toggle');
        await user.click(screen.getByTestId('create-starter-task'));

        await waitFor(() =>
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Add a dark-mode toggle' })
            )
        );
        // Born approved, so it never joins the queue — the page says so rather than losing it.
        expect(await screen.findByTestId('created-task-confirmation')).toHaveTextContent(
            /add a dark-mode toggle/i
        );
    });

    it('does not offer hand-authoring to HR', async () => {
        permissionGroup.current = 'HR';
        render(<StarterWorkPage />);

        await screen.findByText('Fix the login redirect');
        expect(screen.queryByTestId('add-starter-task')).not.toBeInTheDocument();
    });
});
