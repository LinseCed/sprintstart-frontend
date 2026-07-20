import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GithubHistorySection } from '../../../../src/features/profile/components/GithubHistorySection';

vi.mock('../../../../src/services/githubHistoryService', () => ({
    githubHistoryService: {
        fetchPrior: vi.fn(),
        grantConsent: vi.fn(),
        revokeConsent: vi.fn(),
    },
}));

import { githubHistoryService } from '../../../../src/services/githubHistoryService';

describe('GithubHistorySection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers to turn the feature on when the user has not consented', async () => {
        vi.mocked(githubHistoryService.fetchPrior).mockResolvedValue({
            consented: false,
            signals: {},
            computedAt: null,
        });

        render(<GithubHistorySection />);

        const button = await screen.findByRole('button', { name: 'Turn on' });
        expect(button).toHaveAttribute('aria-pressed', 'false');
        // Nothing is derived without consent, so there is nothing to show.
        expect(screen.queryByText('What we found')).not.toBeInTheDocument();
    });

    it('shows what was inferred, grouped and labelled, after opting in', async () => {
        vi.mocked(githubHistoryService.fetchPrior).mockResolvedValue({
            consented: false,
            signals: {},
            computedAt: null,
        });
        vi.mocked(githubHistoryService.grantConsent).mockResolvedValue({
            consented: true,
            signals: { 'repo:owner/api': 9, 'type:PULL_REQUEST': 9, 'label:bug': 2 },
            computedAt: '2026-07-20T00:00:00Z',
        });

        const user = userEvent.setup();
        render(<GithubHistorySection />);

        await user.click(await screen.findByRole('button', { name: 'Turn on' }));

        expect(await screen.findByText('What we found')).toBeInTheDocument();
        // Opaque API keys become readable groups -- the whole record, nothing hidden.
        const section = screen.getByTestId('github-history-section');
        expect(within(section).getByText('Repositories')).toBeInTheDocument();
        expect(within(section).getByText('owner/api')).toBeInTheDocument();
        expect(within(section).getByText('Kind of work')).toBeInTheDocument();
        expect(within(section).getByText('pull request')).toBeInTheDocument();
        expect(within(section).getByText('Issue labels')).toBeInTheDocument();
    });

    it('says the record is empty rather than looking broken', async () => {
        vi.mocked(githubHistoryService.fetchPrior).mockResolvedValue({
            consented: true,
            signals: {},
            computedAt: '2026-07-20T00:00:00Z',
        });

        render(<GithubHistorySection />);

        expect(await screen.findByText(/nothing yet/i)).toBeInTheDocument();
        expect(screen.getByText(/github username isn't\s*set above/i)).toBeInTheDocument();
    });

    it('clears the displayed record when consent is withdrawn', async () => {
        vi.mocked(githubHistoryService.fetchPrior).mockResolvedValue({
            consented: true,
            signals: { 'repo:owner/api': 9 },
            computedAt: '2026-07-20T00:00:00Z',
        });
        vi.mocked(githubHistoryService.revokeConsent).mockResolvedValue();

        const user = userEvent.setup();
        render(<GithubHistorySection />);

        await user.click(await screen.findByRole('button', { name: 'Turn off and delete' }));

        await waitFor(() => {
            expect(screen.queryByText('owner/api')).not.toBeInTheDocument();
        });
        expect(githubHistoryService.revokeConsent).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    });

    it('surfaces a failure instead of silently leaving the toggle wrong', async () => {
        vi.mocked(githubHistoryService.fetchPrior).mockResolvedValue({
            consented: false,
            signals: {},
            computedAt: null,
        });
        vi.mocked(githubHistoryService.grantConsent).mockRejectedValue(new Error('Backend down'));

        const user = userEvent.setup();
        render(<GithubHistorySection />);

        await user.click(await screen.findByRole('button', { name: 'Turn on' }));

        expect(await screen.findByText('Backend down')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    });
});
