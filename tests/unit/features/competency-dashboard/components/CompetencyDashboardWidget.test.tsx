import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CompetencyDashboardWidget } from '../../../../../src/features/competency-dashboard/components/CompetencyDashboardWidget';
import type { CompetencyAggregate } from '../../../../../src/features/competency-dashboard/types';

const mockAggregate: CompetencyAggregate[] = [
    {
        competencyKey: 'kotlin',
        label: 'Kotlin',
        kind: 'SKILL',
        usersEngaged: 5,
        levelCounts: { 1: 1, 2: 2, 3: 1, 4: 1 },
        sourceCounts: { assessed: 2, verified: 2, declared: 1 }
    },
    {
        competencyKey: 'git',
        label: 'Git',
        kind: 'SKILL',
        usersEngaged: 3,
        levelCounts: { 1: 3 },
        sourceCounts: { assessed: 0, verified: 1, declared: 2 }
    }
];

vi.mock('../../../../../src/hooks/useFetch', () => ({
    useFetch: vi.fn()
}));

vi.mock('../../../../../src/services/competencyDashboardService', () => ({
    competencyDashboardService: {
        fetchCompetencyAggregate: vi.fn(),
        fetchUserCompetencySummaries: vi.fn()
    }
}));

import { useFetch } from '../../../../../src/hooks/useFetch';

function renderWidget() {
    return render(
        <MemoryRouter>
            <CompetencyDashboardWidget />
        </MemoryRouter>
    );
}

describe('CompetencyDashboardWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useFetch).mockReturnValue({ data: mockAggregate, loading: false, error: false });
    });

    it('renders the widget header', () => {
        renderWidget();
        expect(screen.getByText('Team competency signal')).toBeInTheDocument();
    });

    it('renders each competency sorted by users engaged', () => {
        renderWidget();
        expect(screen.getByText('Kotlin')).toBeInTheDocument();
        expect(screen.getByText('Git')).toBeInTheDocument();
    });

    it('shows the "See all" link with total count', () => {
        renderWidget();
        expect(screen.getByText(/See all \(2\)/)).toBeInTheDocument();
    });

    it('shows loading state', () => {
        vi.mocked(useFetch).mockReturnValueOnce({ data: null, loading: true, error: false });
        const { container } = renderWidget();
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows the empty state when there is no signal yet', () => {
        vi.mocked(useFetch).mockReturnValueOnce({ data: [], loading: false, error: false });
        renderWidget();
        expect(screen.getByText(/no competency signal yet/i)).toBeInTheDocument();
    });

    it('shows the empty state on error', () => {
        vi.mocked(useFetch).mockReturnValueOnce({ data: null, loading: false, error: true });
        renderWidget();
        expect(screen.getByText(/no competency signal yet/i)).toBeInTheDocument();
    });
});
