import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskOrientationManager } from '../../../../src/features/orientation/components/TaskOrientationManager';
import { starterWorkService } from '../../../../src/services/starterWorkService';
import { userService } from '../../../../src/services/userService';
import { orientationService } from '../../../../src/services/orientationService';
import type { StarterWorkTask } from '../../../../src/features/starter-work/types';

const approvedTask: StarterWorkTask = {
    id: 'task-1',
    sourceId: 'github:acme/repo:ISSUE:42',
    title: 'Fix the login redirect',
    summary: null,
    rationale: null,
    sourceUrl: 'https://github.com/acme/repo/issues/42',
    competencyKeys: [],
    status: 'APPROVED',
    onboardingTrackKey: null
};

describe('TaskOrientationManager', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.localStorage.clear();
        vi.spyOn(userService, 'getMyProjects').mockResolvedValue([{ id: 'p1', name: 'Proj' }]);
        vi.spyOn(starterWorkService, 'fetchApproved').mockResolvedValue([approvedTask]);
    });

    it('lists approved tasks and opens the editor scoped to task and project', async () => {
        const user = userEvent.setup();
        const fetchOrientation = vi
            .spyOn(orientationService, 'fetchTaskOrientation')
            .mockResolvedValue({ taskId: 'task-1', taskTitle: 'Fix the login redirect', taskUrl: null, packet: null, reason: null });

        render(<TaskOrientationManager isAdmin={false} />);

        expect(await screen.findByText('Fix the login redirect')).toBeInTheDocument();

        await user.click(screen.getByTestId('edit-orientation-task-1'));

        await waitFor(() => expect(fetchOrientation).toHaveBeenCalledWith('task-1', 'p1'));
        expect(await screen.findByTestId('orientation-editor')).toBeInTheDocument();
    });

    it('shows an empty state when there are no approved tasks', async () => {
        vi.spyOn(starterWorkService, 'fetchApproved').mockResolvedValue([]);

        render(<TaskOrientationManager isAdmin={false} />);

        expect(await screen.findByText(/No approved tasks yet/)).toBeInTheDocument();
    });
});
