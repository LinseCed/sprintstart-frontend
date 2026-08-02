import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArrivalStepAuthoring } from '../../../../src/features/arrival/components/ArrivalStepAuthoring';
import { arrivalService } from '../../../../src/services/arrivalService';
import type { ArrivalStep } from '../../../../src/features/arrival/types';

vi.mock('../../../../src/services/arrivalService', () => ({
    arrivalService: {
        listSteps: vi.fn(),
        createStep: vi.fn(),
        reorderSteps: vi.fn(),
        deleteStep: vi.fn(),
    },
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

describe('ArrivalStepAuthoring', () => {
    beforeEach(() => {
        vi.mocked(arrivalService.listSteps).mockReset().mockResolvedValue([step()]);
        vi.mocked(arrivalService.createStep).mockReset();
        vi.mocked(arrivalService.reorderSteps).mockReset();
        vi.mocked(arrivalService.deleteStep).mockReset();
    });

    it('states that the list does not block anyone', async () => {
        render(<ArrivalStepAuthoring />);

        // "Mandatory steps" reads like a gate, and the previous model was one. The page has to say
        // otherwise, or a PM will reasonably assume it withholds work until the list is done.
        expect(await screen.findByText(/Nothing here blocks anyone/i)).toBeInTheDocument();
    });

    it('distinguishes an empty list from a broken one', async () => {
        vi.mocked(arrivalService.listSteps).mockResolvedValue([]);

        render(<ArrivalStepAuthoring />);

        expect(await screen.findByText(/No arrival steps yet/i)).toBeInTheDocument();
        // The consequence is the useful half: nobody sees the card at all until something exists.
        expect(screen.getByText(/nobody sees this card/i)).toBeInTheDocument();
    });

    it('says what survives a removal before removing it', async () => {
        render(<ArrivalStepAuthoring />);
        fireEvent.click(await screen.findByRole('button', { name: /Remove "Request VPN access"/ }));

        // What a PM cannot guess is what is kept: state is keyed by the step key, so people's
        // records outlive the definition and re-adding the key brings them back.
        expect(screen.getByText(/Records of people who already did it are kept/i)).toBeInTheDocument();
        expect(arrivalService.deleteStep).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        await waitFor(() => {
            expect(arrivalService.deleteStep).toHaveBeenCalledWith('vpn', null);
        });
    });

    it('sends the whole order when a step is moved', async () => {
        vi.mocked(arrivalService.listSteps).mockResolvedValue([
            step({ key: 'vpn', title: 'Request VPN access' }),
            step({ key: 'laptop', title: 'Collect a laptop', position: 1 }),
        ]);

        render(<ArrivalStepAuthoring />);
        fireEvent.click(await screen.findByRole('button', { name: /Move "Collect a laptop" earlier/ }));

        // Never a from/to pair: two people reordering at once must not interleave into an order
        // neither of them chose.
        await waitFor(() => {
            expect(arrivalService.reorderSteps).toHaveBeenCalledWith(['laptop', 'vpn'], null);
        });
    });

    it('warns that the key is fixed at the point of choosing one', async () => {
        render(<ArrivalStepAuthoring />);
        fireEvent.click(await screen.findByRole('button', { name: 'Add a step' }));

        expect(screen.getByText(/fixed once saved/i)).toBeInTheDocument();
    });

    it('shows the list to a read-only viewer but offers no way to change it', async () => {
        render(<ArrivalStepAuthoring readOnly />);

        // HR reads the real list rather than a notice standing in for it — they are often the
        // person who knows what it should say.
        expect(await screen.findByText('Request VPN access')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add a step' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Remove "Request VPN access"/ })).not.toBeInTheDocument();
        expect(screen.getByText(/a PM or an admin can/i)).toBeInTheDocument();
    });
});
