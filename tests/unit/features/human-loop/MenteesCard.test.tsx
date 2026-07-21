import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MenteesCard } from '../../../../src/features/human-loop/components/MenteesCard';
import { humanLoopService } from '../../../../src/services/humanLoopService';
import type { Mentee } from '../../../../src/features/human-loop/types';

vi.mock('../../../../src/services/humanLoopService', () => ({
    humanLoopService: {
        fetchMyMentees: vi.fn(),
        logContact: vi.fn()
    }
}));

function mentee(overrides: Partial<Mentee> = {}): Mentee {
    return {
        hireId: 'h1',
        hireName: 'Bo Reeves',
        hireGithubLogin: 'bo',
        projectId: 'p1',
        cadenceTargetDays: 7,
        assignedAt: '2026-07-01T00:00:00Z',
        lastContactAt: null,
        daysSinceContact: 2,
        overdue: false,
        alerts: [],
        ...overrides
    };
}

describe('MenteesCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when the user mentors nobody', async () => {
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([]);

        const { container } = render(<MenteesCard />);

        await waitFor(() => expect(humanLoopService.fetchMyMentees).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    it('surfaces a waiting-review alert as the buddy\'s move', async () => {
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([
            mentee({
                alerts: [
                    { reason: 'A pull request has been waiting 3 days for a response', severity: 'BLOCKED', days: 3 }
                ]
            })
        ]);

        render(<MenteesCard />);

        expect(await screen.findByText('Bo Reeves')).toBeInTheDocument();
        expect(
            screen.getByText('A pull request has been waiting 3 days for a response')
        ).toBeInTheDocument();
        // The concrete way to reach them.
        expect(screen.getByRole('link', { name: /reach @bo/i })).toHaveAttribute(
            'href',
            'https://github.com/bo'
        );
    });

    it('shows a calm on-track state when nothing is outstanding', async () => {
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([mentee({ daysSinceContact: 1 })]);

        render(<MenteesCard />);

        expect(await screen.findByText(/on track/i)).toBeInTheDocument();
    });

    it('logs a contact for the named hire and refreshes', async () => {
        vi.mocked(humanLoopService.fetchMyMentees)
            .mockResolvedValueOnce([mentee()])
            .mockResolvedValueOnce([mentee({ daysSinceContact: 0 })]);
        vi.mocked(humanLoopService.logContact).mockResolvedValue(undefined);
        const user = userEvent.setup();

        render(<MenteesCard />);
        await screen.findByText('Bo Reeves');

        await user.click(screen.getByRole('button', { name: /we spoke/i }));

        expect(humanLoopService.logContact).toHaveBeenCalledWith('p1', { hireId: 'h1' });
        await waitFor(() => expect(humanLoopService.fetchMyMentees).toHaveBeenCalledTimes(2));
    });
});
