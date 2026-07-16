import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillAssessmentPage } from '../../../src/pages/SkillAssessmentPage';

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn(),
    },
}));

import { assessmentService } from '../../../src/services/assessmentService';

describe('SkillAssessmentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('starts the assessment and shows the first question', async () => {
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 'session1',
            question: 'Walk me through a recent PR.',
        });

        render(<SkillAssessmentPage />);

        await waitFor(() => {
            expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        });
    });

    it('walks through turns and shows the path view once done', async () => {
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 'session1',
            question: 'Q1',
        });
        vi.mocked(assessmentService.answerAssessment).mockResolvedValue({ done: true, question: null });
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'mastered' }],
            edges: [],
            graphVersion: 1,
        });

        const user = userEvent.setup();
        render(<SkillAssessmentPage />);

        await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText('Type your answer...'), 'my answer');
        await user.click(screen.getByRole('button', { name: 'Send answer' }));

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });
        expect(screen.getByText('Your personalized path')).toBeInTheDocument();
    });

    it('shows an error state with a retry button when starting fails', async () => {
        vi.mocked(assessmentService.startAssessment)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ sessionId: 'session1', question: 'Q1' });

        const user = userEvent.setup();
        render(<SkillAssessmentPage />);

        await waitFor(() => {
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeInTheDocument();
        });
    });
});
