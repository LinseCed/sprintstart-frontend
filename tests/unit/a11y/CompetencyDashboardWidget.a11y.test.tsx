import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { CompetencyDashboardWidget } from '../../../src/features/competency-dashboard/components/CompetencyDashboardWidget';

vi.mock('../../../src/hooks/useFetch', () => ({
    useFetch: () => ({
        data: [
            {
                competencyKey: 'kotlin',
                label: 'Kotlin',
                kind: 'SKILL',
                usersEngaged: 5,
                levelCounts: { 1: 1, 2: 2, 3: 1, 4: 1 },
                sourceCounts: { assessed: 2, verified: 2, declared: 1 }
            }
        ],
        loading: false,
        error: false
    })
}));

vi.mock('../../../src/services/competencyDashboardService', () => ({
    competencyDashboardService: {
        fetchCompetencyAggregate: vi.fn(),
        fetchUserCompetencySummaries: vi.fn()
    }
}));

describe('CompetencyDashboardWidget Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <CompetencyDashboardWidget />
                </main>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
