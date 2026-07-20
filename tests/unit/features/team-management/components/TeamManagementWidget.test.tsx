import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamManagementWidget } from '../../../../../src/features/team-management/components/TeamManagementWidget';
import type { TeamOverviewUser } from '../../../../../src/features/team-management/types';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../../src/components/common/UserAvatar', () => ({
    UserAvatar: () => <svg role="img" aria-label="User Avatar" width="32" height="32" />,
}));

vi.mock('../../../../../src/services/teamManagementService', () => ({
    getTeamOverview: vi.fn(),
}));

import { getTeamOverview } from '../../../../../src/services/teamManagementService';

function createUser(overrides: Partial<TeamOverviewUser> = {}): TeamOverviewUser {
    return {
        userId: 'u1',
        firstname: 'Alice',
        lastname: 'Smith',
        roles: [],
        competencies: [],
        hasFeedback: false,
        projects: [{ id: 'proj1', name: 'Project 1' }],
        ...overrides,
    };
}

function renderWidget() {
    return render(
        <MemoryRouter>
            <TeamManagementWidget />
        </MemoryRouter>,
    );
}

describe('TeamManagementWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        vi.mocked(getTeamOverview).mockImplementation(() => new Promise(() => {}));
        const { container } = renderWidget();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows error state when the service fails', async () => {
        vi.mocked(getTeamOverview).mockRejectedValue(new Error('Network error'));
        renderWidget();

        await waitFor(() => expect(screen.getByText('Could not load team data.')).toBeInTheDocument());
    });

    it('renders the header with "Team progress"', async () => {
        vi.mocked(getTeamOverview).mockResolvedValue([createUser()]);
        renderWidget();

        await waitFor(() => expect(screen.getByText('Team progress')).toBeInTheDocument());
    });

    it('surfaces the members with the fewest held competencies first', async () => {
        // "Needs attention" is now fewest proven competencies -- time-on-step no longer exists.
        const users = [
            createUser({
                userId: 'u1',
                firstname: 'Alice',
                competencies: [
                    { competencyKey: 'a', label: 'A', level: 3, source: 'VERIFIED', updatedAt: '2026-07-01T00:00:00Z' },
                ],
            }),
            createUser({ userId: 'u2', firstname: 'Bob', competencies: [] }),
        ];
        vi.mocked(getTeamOverview).mockResolvedValue(users);
        renderWidget();

        await waitFor(() => expect(screen.getByText(/Bob/)).toBeInTheDocument());
        expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('shows the "See all" link with total count', async () => {
        vi.mocked(getTeamOverview).mockResolvedValue([createUser({ userId: 'u1' }), createUser({ userId: 'u2' })]);
        renderWidget();

        await waitFor(() => expect(screen.getByText(/See all \(2\)/)).toBeInTheDocument());
    });

    it('shows unread feedback count badge when users have feedback', async () => {
        vi.mocked(getTeamOverview).mockResolvedValue([createUser({ hasFeedback: true })]);
        renderWidget();

        await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    });

    it('shows error state when no users are returned', async () => {
        vi.mocked(getTeamOverview).mockResolvedValue([]);
        renderWidget();

        await waitFor(() => expect(screen.getByText('Could not load team data.')).toBeInTheDocument());
    });
});
