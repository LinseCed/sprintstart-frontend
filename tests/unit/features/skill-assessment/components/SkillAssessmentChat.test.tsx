import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SkillAssessmentChat } from '../../../../../src/features/skill-assessment/components/SkillAssessmentChat';
import type { AssessmentChatMessage } from '../../../../../src/features/skill-assessment/types';

const messages: AssessmentChatMessage[] = [
    { id: 'q-0', role: 'assistant', content: 'Walk me through a recent PR.' },
    { id: 'a-0', role: 'user', content: 'I fixed a null-pointer bug.' },
];

describe('SkillAssessmentChat', () => {
    it('renders the transcript', () => {
        render(<SkillAssessmentChat messages={messages} isThinking={false} onSubmitAnswer={vi.fn()} />);

        expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        expect(screen.getByText('I fixed a null-pointer bug.')).toBeInTheDocument();
    });

    it('shows a thinking indicator while waiting on the interviewer', () => {
        render(<SkillAssessmentChat messages={messages} isThinking onSubmitAnswer={vi.fn()} />);

        expect(document.querySelectorAll('.animate-bounce')).toHaveLength(3);
    });

    it('submits the typed answer and clears the input', async () => {
        const onSubmitAnswer = vi.fn();
        const user = userEvent.setup();
        render(<SkillAssessmentChat messages={messages} isThinking={false} onSubmitAnswer={onSubmitAnswer} />);

        const textarea = screen.getByPlaceholderText('Type your answer...');
        await user.type(textarea, 'my answer');
        await user.click(screen.getByRole('button', { name: 'Send answer' }));

        expect(onSubmitAnswer).toHaveBeenCalledWith('my answer');
        expect(textarea).toHaveValue('');
    });

    it('disables the submit button while thinking or when the answer is blank', () => {
        render(<SkillAssessmentChat messages={messages} isThinking onSubmitAnswer={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Send answer' })).toBeDisabled();
    });
});
