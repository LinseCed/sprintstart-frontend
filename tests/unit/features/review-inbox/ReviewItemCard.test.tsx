import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewItemCard } from '../../../../src/features/review-inbox/components/ReviewItemCard';
import type { ReviewItemView } from '../../../../src/features/review-inbox/types';

const item: ReviewItemView = {
    id: 't1',
    kind: 'task',
    title: 'Fix the flaky ingestion retry',
    detail: 'Touches the crawl scheduler.',
    tag: '2 skills',
};

function renderCard(overrides: Partial<Parameters<typeof ReviewItemCard>[0]> = {}) {
    const props = {
        item,
        canAct: true,
        busy: false,
        onApprove: vi.fn(),
        onReject: vi.fn(),
        ...overrides,
    };
    render(<ReviewItemCard {...props} />);
    return props;
}

describe('ReviewItemCard', () => {
    /**
     * Since D1 a mined task is live and claimable the moment it lands. "Approve" said a hire could
     * not see it until somebody clicked, which is false — and a PM believing it either rushes a
     * queue nobody is waiting on or assumes hires have nothing to claim.
     */
    it('does not describe looking a task over as approving it', () => {
        renderCard();

        expect(screen.getByRole('button', { name: /looked over/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Approve/ })).not.toBeInTheDocument();
    });

    /**
     * The two actions are not opposites: one changes a ranking, the other takes work out of the
     * pool. Rendering them as ✓/✗ twins hid which one is destructive.
     */
    it('names the destructive action for what it removes', () => {
        renderCard();

        expect(screen.getByRole('button', { name: /out of the pool/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Reject/ })).not.toBeInTheDocument();
    });

    it('still routes each action to its own handler', () => {
        const { onApprove, onReject } = renderCard();

        fireEvent.click(screen.getByRole('button', { name: /looked over/i }));
        expect(onApprove).toHaveBeenCalledWith(item);

        fireEvent.click(screen.getByRole('button', { name: /out of the pool/i }));
        expect(onReject).toHaveBeenCalledWith(item);
    });

    it('offers no actions to somebody who may only read', () => {
        renderCard({ canAct: false });

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByText(item.title)).toBeInTheDocument();
    });

    it('disables both actions while one is in flight', () => {
        renderCard({ busy: true });

        screen.getAllByRole('button').forEach((button) => {
            expect(button).toBeDisabled();
        });
    });
});
