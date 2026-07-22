import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuddyCard } from '../../../../src/features/human-loop/components/BuddyCard';
import { humanLoopService } from '../../../../src/services/humanLoopService';
import { openAiBuddy } from '../../../../src/features/buddy/aiBuddyBus';
import type { MyBuddy } from '../../../../src/features/human-loop/types';

vi.mock('../../../../src/services/humanLoopService', () => ({
    humanLoopService: {
        fetchMyBuddy: vi.fn(),
        fetchMyTimeline: vi.fn(),
        logContact: vi.fn()
    }
}));

vi.mock('../../../../src/features/buddy/aiBuddyBus', () => ({
    openAiBuddy: vi.fn()
}));

function buddy(overrides: Partial<MyBuddy> = {}): MyBuddy {
    return {
        buddyId: 'b1',
        buddyName: 'Bo Reeves',
        buddyGithubLogin: 'bo',
        projectId: 'p1',
        assignedAt: '2026-07-01T00:00:00Z',
        cadenceTargetDays: 7,
        lastContactAt: null,
        daysSinceContact: 2,
        overdue: false,
        ...overrides
    };
}

describe('BuddyCard (buddy-first)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // "No timeline" reaches the hook as a failed read (e.g. a 404), which it
        // degrades to null — the service contract never returns null itself.
        vi.mocked(humanLoopService.fetchMyTimeline).mockRejectedValue(new Error('404'));
    });

    it('leads with the AI buddy and opens it on click', async () => {
        vi.mocked(humanLoopService.fetchMyBuddy).mockResolvedValue(buddy());

        render(<BuddyCard projectId="p1" />);

        const askBuddy = await screen.findByRole('button', { name: /Ask your buddy/ });
        await userEvent.click(askBuddy);

        expect(openAiBuddy).toHaveBeenCalledTimes(1);
    });

    it('keeps the human as a demoted last resort, not the default', async () => {
        vi.mocked(humanLoopService.fetchMyBuddy).mockResolvedValue(buddy());

        render(<BuddyCard projectId="p1" />);

        // The human path is present (control arm), framed as the fallback.
        const human = await screen.findByRole('link', { name: /Prefer a person\? Ask Bo/ });
        expect(human).toHaveAttribute('href', 'https://github.com/bo');
    });

    it('still leads with the AI buddy when no human is assigned', async () => {
        vi.mocked(humanLoopService.fetchMyBuddy).mockResolvedValue(null);

        render(<BuddyCard projectId="p1" />);

        expect(await screen.findByRole('button', { name: /Ask your buddy/ })).toBeInTheDocument();
        expect(screen.queryByText(/Prefer a person/)).not.toBeInTheDocument();
    });
});
