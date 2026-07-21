import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AutonomyBanner } from '../../../../src/features/ramp/components/AutonomyBanner';

describe('AutonomyBanner', () => {
    it('announces the moment, dated, and says what it means', () => {
        render(
            <AutonomyBanner
                autonomy={{
                    reached: true,
                    reachedAt: '2026-07-18T10:00:00Z',
                    provenByArtifactId: 'a1',
                    blockers: []
                }}
            />
        );

        // Dated, so it is a moment somebody can point at rather than a threshold crossed.
        expect(screen.getByText(/off the ramp — .*2026/)).toBeInTheDocument();
        // The definition travels with the claim -- a badge with no definition is a grade.
        expect(screen.getByText(/no help and no rework/)).toBeInTheDocument();
    });

    it('states what is missing rather than a score', () => {
        render(
            <AutonomyBanner
                autonomy={{
                    reached: false,
                    reachedAt: null,
                    provenByArtifactId: null,
                    blockers: ['Your last merged change was sent back for rework']
                }}
            />
        );

        expect(screen.getByText(/sent back for rework/)).toBeInTheDocument();
        // And it says the blocker is not a mark against them.
        expect(screen.getByText(/Neither of those is a mark against you/)).toBeInTheDocument();
    });

    it('renders nothing when there is no signal either way', () => {
        const { container } = render(
            <AutonomyBanner
                autonomy={{ reached: false, reachedAt: null, provenByArtifactId: null, blockers: [] }}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
