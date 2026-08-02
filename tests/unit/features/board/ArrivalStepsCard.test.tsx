import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardGrid } from '../../../../src/features/board/components/BoardGrid';
import { arrivalService } from '../../../../src/services/arrivalService';
import type { ArrivalStep } from '../../../../src/features/arrival/types';
import type { Board, BoardCard, ArrivalStepsContent } from '../../../../src/features/board/types';

vi.mock('../../../../src/services/arrivalService', () => ({
    arrivalService: { confirmStep: vi.fn() },
}));

const step = (over: Partial<ArrivalStep> = {}): ArrivalStep => ({
    key: 'vpn',
    projectId: null,
    title: 'Request VPN access',
    description: null,
    href: null,
    position: 0,
    settledBy: 'DECLARED',
    settled: false,
    settledAt: null,
    rigor: null,
    ...over,
});

const arrivalContent = (over: Partial<ArrivalStepsContent> = {}): ArrivalStepsContent => ({
    kind: 'ARRIVAL_STEPS',
    steps: [step()],
    observedCount: 0,
    declaredCount: 0,
    outstandingCount: 1,
    ...over,
});

function board(cards: BoardCard['content'][]): Board {
    return {
        boardId: 'b1',
        projectId: 'p1',
        vocabulary: {
            trackLabel: 'Engineering',
            contributionNoun: 'change',
            contributionNounPlural: 'changes',
            contributionVerbPast: 'merged',
        },
        cards: cards.map((content, index) => ({
            id: `c${index}`,
            kind: content.kind,
            owner: 'AI',
            position: index,
            placedAt: null,
            content,
        })),
    };
}

describe('ArrivalStepsCard', () => {
    beforeEach(() => {
        vi.mocked(arrivalService.confirmStep).mockReset();
    });

    it('lists what is still outstanding', () => {
        render(<BoardGrid board={board([arrivalContent()])} />);

        expect(screen.getByText('Request VPN access')).toBeInTheDocument();
        expect(screen.getByText(/1 still to do/)).toBeInTheDocument();
    });

    /**
     * The defect that killed the previous onboarding model: a single figure that counted a ticked
     * box exactly like something the system had verified. Counts are named by how they were
     * established precisely so they cannot collapse into one score.
     */
    it('never renders a blended completion figure', () => {
        render(
            <BoardGrid
                board={board([
                    arrivalContent({
                        steps: [
                            step({ key: 'a', settled: true, rigor: 'DECLARED', settledAt: 'x' }),
                            step({ key: 'b', title: 'Get a laptop' }),
                        ],
                        declaredCount: 1,
                        outstandingCount: 1,
                    }),
                ])}
            />,
        );

        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        // "1 of 2" is the same conflation spelled differently.
        expect(screen.queryByText(/\d+\s*(of|\/)\s*\d+/)).not.toBeInTheDocument();
    });

    it('attributes a self-confirmed step to the hire rather than to the system', () => {
        render(
            <BoardGrid
                board={board([
                    arrivalContent({
                        steps: [step({ settled: true, rigor: 'DECLARED', settledAt: 'x' })],
                        declaredCount: 1,
                        outstandingCount: 0,
                    }),
                ])}
            />,
        );

        expect(screen.getByText('You marked this done')).toBeInTheDocument();
        expect(screen.queryByText('Confirmed automatically')).not.toBeInTheDocument();
    });

    it('confirming a step settles it in place', async () => {
        vi.mocked(arrivalService.confirmStep).mockResolvedValue(
            step({ settled: true, rigor: 'DECLARED', settledAt: '2026-08-02T10:00:00Z' }),
        );

        render(<BoardGrid board={board([arrivalContent()])} />);
        fireEvent.click(screen.getByRole('button', { name: /done this/i }));

        await waitFor(() => {
            expect(screen.getByText('You marked this done')).toBeInTheDocument();
        });
        expect(arrivalService.confirmStep).toHaveBeenCalledWith('vpn');
    });

    it('says so when confirming fails rather than showing it as done', async () => {
        vi.mocked(arrivalService.confirmStep).mockRejectedValue(new Error('nope'));

        render(<BoardGrid board={board([arrivalContent()])} />);
        fireEvent.click(screen.getByRole('button', { name: /done this/i }));

        await waitFor(() => {
            expect(screen.getByText(/didn't save/i)).toBeInTheDocument();
        });
        expect(screen.queryByText('You marked this done')).not.toBeInTheDocument();
    });

    /**
     * A step the system settles is not one a hire ticks — the backend refuses it, and offering the
     * button would be an affordance whose only outcome is an error.
     */
    it('offers no confirm button for a step the system settles', () => {
        render(
            <BoardGrid
                board={board([arrivalContent({ steps: [step({ settledBy: 'OBSERVED' })] })])}
            />,
        );

        expect(screen.queryByRole('button', { name: /done this/i })).not.toBeInTheDocument();
    });
});
