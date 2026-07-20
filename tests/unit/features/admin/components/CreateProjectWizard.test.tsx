import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProjectWizard } from '../../../../../src/features/admin/components/CreateProjectWizard';
import type { AdminProjectDetails } from '../../../../../src/services/projectService';

vi.mock('../../../../../src/services/projectService', () => ({
    projectService: {
        createProject: vi.fn(),
        getManagerCandidates: vi.fn(),
        setProjectManager: vi.fn(),
    },
}));

vi.mock('../../../../../src/services/sources/githubService', () => ({
    connectGithubRepository: vi.fn(),
}));

import { projectService } from '../../../../../src/services/projectService';
import { connectGithubRepository } from '../../../../../src/services/sources/githubService';

const createdProject: AdminProjectDetails = {
    id: 'proj-new',
    name: 'Apollo',
    description: '',
    manager: null,
    sources: [],
    users: [],
};

function renderWizard(overrides: Partial<Parameters<typeof CreateProjectWizard>[0]> = {}) {
    const onClose = vi.fn();
    const onProjectCreated = vi.fn();

    render(
        <CreateProjectWizard
            isOpen
            tokenNames={['team-pat']}
            onClose={onClose}
            onProjectCreated={onProjectCreated}
            {...overrides}
        />,
    );

    return { onClose, onProjectCreated };
}

/**
 * Lets the modal's mount-time autofocus run.
 *
 * `Modal` grabs focus inside a `requestAnimationFrame`; without waiting for it,
 * the frame can fire midway through typing and pull focus off the field, which
 * silently drops the remaining keystrokes.
 */
async function settleModalFocus() {
    await act(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    });
}

/** Fills in the name on step 1 and moves to the sources step. */
async function goToSourcesStep(user: ReturnType<typeof userEvent.setup>) {
    await settleModalFocus();
    await user.type(screen.getByLabelText('Name'), 'Apollo');
    await user.click(screen.getByRole('button', { name: /continue/i }));
}

async function addRepository(
    user: ReturnType<typeof userEvent.setup>,
    reference: string,
) {
    await user.type(screen.getByLabelText('Repository owner'), reference);
    await user.click(screen.getByRole('button', { name: /add repository/i }));
}

describe('CreateProjectWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(projectService.getManagerCandidates).mockResolvedValue([]);
        vi.mocked(projectService.createProject).mockResolvedValue(createdProject);
        vi.mocked(connectGithubRepository).mockResolvedValue({ transactionId: 'tx' });
    });

    it('blocks the step-1 continue button until a name is entered', async () => {
        const user = userEvent.setup();
        renderWizard();
        await settleModalFocus();

        expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();

        await user.type(screen.getByLabelText('Name'), 'Apollo');

        expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    });

    it('creates the project without sources when the source step is skipped', async () => {
        const user = userEvent.setup();
        const { onClose, onProjectCreated } = renderWizard();

        await goToSourcesStep(user);
        await user.click(screen.getByRole('button', { name: /create without sources/i }));

        await waitFor(() =>
            expect(vi.mocked(projectService.createProject)).toHaveBeenCalledWith({
                name: 'Apollo',
                description: undefined,
            }),
        );
        expect(vi.mocked(connectGithubRepository)).not.toHaveBeenCalled();
        expect(onProjectCreated).toHaveBeenCalledWith(createdProject);
        expect(onClose).toHaveBeenCalled();
    });

    it('assigns the chosen manager after creating the project', async () => {
        vi.mocked(projectService.getManagerCandidates).mockResolvedValue([
            {
                id: 'user-7',
                username: 'jane.doe',
                email: 'jane@example.com',
                firstName: 'Jane',
                lastName: 'Doe',
            },
        ]);
        const user = userEvent.setup();
        renderWizard();
        await settleModalFocus();

        await waitFor(() =>
            expect(screen.getByRole('option', { name: 'Jane Doe' })).toBeInTheDocument(),
        );

        await user.type(screen.getByLabelText('Name'), 'Apollo');
        await user.selectOptions(screen.getByLabelText('Project manager'), 'user-7');
        await user.click(screen.getByRole('button', { name: /continue/i }));
        await user.click(screen.getByRole('button', { name: /create without sources/i }));

        await waitFor(() =>
            expect(vi.mocked(projectService.setProjectManager)).toHaveBeenCalledWith(
                'proj-new',
                'user-7',
            ),
        );
    });

    it('connects every staged repository against the new project id', async () => {
        const user = userEvent.setup();
        renderWizard();

        await goToSourcesStep(user);
        await addRepository(user, 'acme/widgets');
        await addRepository(user, 'acme/gadgets');

        await user.click(
            screen.getByRole('button', { name: /create and connect 2 repositories/i }),
        );

        await waitFor(() =>
            expect(vi.mocked(connectGithubRepository)).toHaveBeenCalledTimes(2),
        );
        expect(vi.mocked(connectGithubRepository)).toHaveBeenCalledWith({
            owner: 'acme',
            name: 'widgets',
            tokenName: 'team-pat',
            projectId: 'proj-new',
        });
    });

    it('rejects a repository that is already on the list', async () => {
        const user = userEvent.setup();
        renderWizard();

        await goToSourcesStep(user);
        await addRepository(user, 'acme/widgets');
        await addRepository(user, 'ACME/Widgets');

        expect(screen.getByText(/is already on the list/i)).toBeInTheDocument();
        expect(screen.getAllByText('acme/widgets')).toHaveLength(1);
    });

    it('keeps the project and offers a retry when a source fails to connect', async () => {
        vi.mocked(connectGithubRepository).mockRejectedValueOnce(
            new Error('token expired'),
        );
        const user = userEvent.setup();
        const { onClose, onProjectCreated } = renderWizard();

        await goToSourcesStep(user);
        await addRepository(user, 'acme/widgets');
        await user.click(
            screen.getByRole('button', { name: /create and connect 1 repository/i }),
        );

        await waitFor(() => expect(screen.getByText('token expired')).toBeInTheDocument());
        // The project itself succeeded, so it is reported and the wizard stays
        // open instead of discarding the staged list.
        expect(onProjectCreated).toHaveBeenCalledWith(createdProject);
        expect(onClose).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Retry' }));

        await waitFor(() => expect(screen.getByText(/connected/i)).toBeInTheDocument());
        // The retry must not create a second project.
        expect(vi.mocked(projectService.createProject)).toHaveBeenCalledTimes(1);
    });

    it('does not create the project when the wizard is cancelled on the source step', async () => {
        const user = userEvent.setup();
        const { onClose } = renderWizard();

        await goToSourcesStep(user);
        await user.click(screen.getByRole('button', { name: /back/i }));
        await user.click(screen.getByRole('button', { name: /cancel/i }));

        expect(vi.mocked(projectService.createProject)).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
