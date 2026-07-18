import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { SkillAssessmentPage } from '../../../src/pages/SkillAssessmentPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' }, status: 'authenticated' }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn().mockResolvedValue({ sessionId: 'session1', question: 'Walk me through a recent PR.' }),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn(),
    },
    hasCompletedAssessment: vi.fn().mockReturnValue(false),
    markAssessmentCompleted: vi.fn(),
}));

describe('SkillAssessmentPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <main>
                <SkillAssessmentPage />
            </main>,
        );

        await waitFor(() => {
            expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
