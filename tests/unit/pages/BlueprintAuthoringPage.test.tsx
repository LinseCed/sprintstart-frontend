import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlueprintAuthoringPage } from '../../../src/pages/BlueprintAuthoringPage';
import { PermissionGroup } from '../../../src/services/types';

const profile: { permissionGroup: PermissionGroup } = {
    permissionGroup: PermissionGroup.PM,
};
vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile }),
}));

vi.mock('../../../src/services/blueprintService', () => ({
    blueprintService: {
        generate: vi.fn(),
        fetchProposed: vi.fn(),
        approve: vi.fn(),
        reject: vi.fn(),
        approveStep: vi.fn(),
        rejectStep: vi.fn(),
    },
}));

import { blueprintService } from '../../../src/services/blueprintService';

const proposal = {
    scope: 'global',
    version: '3',
    steps: [
        {
            id: 'step-1',
            title: 'Run the stack locally',
            description: 'Boot it end to end',
            requirement: 'required',
            invariant: true,
            proposalId: 'p1',
            status: 'PROPOSED' as const,
        },
    ],
};

describe('BlueprintAuthoringPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        profile.permissionGroup = PermissionGroup.PM;
        vi.mocked(blueprintService.fetchProposed).mockResolvedValue({ blueprints: [proposal] });
    });

    it('renders a proposed baseline with its steps', async () => {
        render(<BlueprintAuthoringPage />);

        const card = await screen.findByTestId('blueprint-global');
        // Storage scopes are translated: a PM shouldn't have to read "global".
        expect(within(card).getByText('Everyone')).toBeInTheDocument();
        expect(within(card).getByText('Run the stack locally')).toBeInTheDocument();
        expect(within(card).getByText('Required')).toBeInTheDocument();
        expect(within(card).getByText('Invariant')).toBeInTheDocument();
    });

    it('explains the empty queue instead of looking broken', async () => {
        vi.mocked(blueprintService.fetchProposed).mockResolvedValue({ blueprints: [] });

        render(<BlueprintAuthoringPage />);

        expect(await screen.findByText(/no baseline waiting for review/i)).toBeInTheDocument();
    });

    it('approves a version and reloads the queue', async () => {
        vi.mocked(blueprintService.approve).mockResolvedValue(proposal);
        const user = userEvent.setup();
        render(<BlueprintAuthoringPage />);

        await user.click(await screen.findByRole('button', { name: /approve & activate/i }));

        expect(blueprintService.approve).toHaveBeenCalledWith('global', '3');
        // Approving supersedes the previous baseline server-side, so local patching would lie.
        await waitFor(() => {
            expect(blueprintService.fetchProposed).toHaveBeenCalledTimes(2);
        });
    });

    it('drops a single step by its proposal id, not its semantic step id', async () => {
        vi.mocked(blueprintService.rejectStep).mockResolvedValue();
        const user = userEvent.setup();
        render(<BlueprintAuthoringPage />);

        await user.click(await screen.findByRole('button', { name: /drop step/i }));

        expect(blueprintService.rejectStep).toHaveBeenCalledWith('p1');
    });

    it('generates proposals and surfaces the per-scope outcome', async () => {
        vi.mocked(blueprintService.generate).mockResolvedValue({
            outcomes: [{ scope: 'global', status: 'generated', message: '4 steps' }],
        });
        const user = userEvent.setup();
        render(<BlueprintAuthoringPage />);

        await user.click(await screen.findByRole('button', { name: /generate baseline/i }));

        expect(await screen.findByText(/generated/)).toBeInTheDocument();
    });

    it('lets HR read the queue but not change it', async () => {
        profile.permissionGroup = PermissionGroup.HR;

        render(<BlueprintAuthoringPage />);

        expect(await screen.findByTestId('blueprint-global')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /approve & activate/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /generate baseline/i })).not.toBeInTheDocument();
    });

    it('surfaces a failure instead of silently doing nothing', async () => {
        vi.mocked(blueprintService.approve).mockRejectedValue(new Error('Backend down'));
        const user = userEvent.setup();
        render(<BlueprintAuthoringPage />);

        await user.click(await screen.findByRole('button', { name: /approve & activate/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Backend down');
    });
});
