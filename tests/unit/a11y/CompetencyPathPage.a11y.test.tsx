import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { CompetencyPathPage } from '../../../src/pages/CompetencyPathPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' } }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn().mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'mastered', level: 3 }],
            edges: [],
            graphVersion: 2,
        }),
    },
    getLastSeenGraphVersion: vi.fn().mockReturnValue(1),
    markGraphVersionSeen: vi.fn(),
}));

describe('CompetencyPathPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <main>
                <CompetencyPathPage />
            </main>,
        );

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
