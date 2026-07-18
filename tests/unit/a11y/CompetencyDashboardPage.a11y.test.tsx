import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { CompetencyDashboardPage } from '../../../src/features/competency-dashboard/components/CompetencyDashboardPage';

vi.mock('../../../src/services/competencyDashboardService', () => ({
    competencyDashboardService: {
        fetchCompetencyAggregate: vi.fn().mockResolvedValue([
            {
                competencyKey: 'kotlin',
                label: 'Kotlin',
                kind: 'SKILL',
                usersEngaged: 5,
                levelCounts: { 1: 1, 2: 2, 3: 1, 4: 1 },
                sourceCounts: { assessed: 2, verified: 2, declared: 1 }
            }
        ]),
        fetchUserCompetencySummaries: vi.fn().mockResolvedValue({
            content: [
                {
                    userId: 'user1',
                    firstname: 'Ada',
                    lastname: 'Lovelace',
                    competencies: [
                        { competencyKey: 'kotlin', label: 'Kotlin', level: 3, source: 'VERIFIED', updatedAt: '2026-07-01T00:00:00.000Z' }
                    ]
                }
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
            first: true,
            last: true
        })
    }
}));

describe('CompetencyDashboardPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <CompetencyDashboardPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
