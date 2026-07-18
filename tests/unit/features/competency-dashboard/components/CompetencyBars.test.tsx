import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompetencyLevelBar, CompetencySourceBar } from '../../../../../src/features/competency-dashboard/components/CompetencyBars';

describe('CompetencyLevelBar', () => {
    it('renders a legend entry for every non-zero level', () => {
        render(<CompetencyLevelBar levelCounts={{ 1: 2, 2: 0, 3: 1, 4: 0 }} />);

        expect(screen.getByText(/2 Beginner/)).toBeInTheDocument();
        expect(screen.getByText(/1 Advanced/)).toBeInTheDocument();
        expect(screen.queryByText(/Intermediate/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Expert/)).not.toBeInTheDocument();
    });

    it('shows a fallback message when no one holds the competency yet', () => {
        render(<CompetencyLevelBar levelCounts={{}} />);

        expect(screen.getByText(/no one has this yet/i)).toBeInTheDocument();
    });
});

describe('CompetencySourceBar', () => {
    it('renders a legend entry for every non-zero source', () => {
        render(<CompetencySourceBar sourceCounts={{ assessed: 1, verified: 2, declared: 0 }} />);

        expect(screen.getByText(/2 Verified/)).toBeInTheDocument();
        expect(screen.getByText(/1 Assessed/)).toBeInTheDocument();
        expect(screen.queryByText(/Declared/)).not.toBeInTheDocument();
    });

    it('renders nothing when there are no counts at all', () => {
        const { container } = render(
            <CompetencySourceBar sourceCounts={{ assessed: 0, verified: 0, declared: 0 }} />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
