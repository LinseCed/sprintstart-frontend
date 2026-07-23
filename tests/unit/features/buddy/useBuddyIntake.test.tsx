import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBuddyIntake } from '../../../../src/features/buddy/hooks/useBuddyIntake';

vi.mock('../../../../src/services/assessmentService', () => ({
    assessmentService: {
        fetchAssessmentStatus: vi.fn(),
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
    },
}));

vi.mock('../../../../src/services/userService', () => ({
    userService: {
        getMyProjects: vi.fn(),
    },
}));

import { assessmentService } from '../../../../src/services/assessmentService';
import { userService } from '../../../../src/services/userService';

describe('useBuddyIntake', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        // Most tests are about the interview itself, once the hire is on a project.
        vi.mocked(userService.getMyProjects).mockResolvedValue([{ id: 'project1', name: 'Project 1' }]);
    });

    it('opens the mentor directly when the hire already has a placement', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: true });

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.mode).toBe('mentor'));
        // Placed already: no interview is started, and no thread is fabricated.
        expect(assessmentService.startAssessment).not.toHaveBeenCalled();
        expect(result.current.messages).toHaveLength(0);
    });

    it('scopes the status/start calls to the hire\'s own project', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({ sessionId: 's1', question: 'Q1' });

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.mode).toBe('intake'));
        expect(assessmentService.fetchAssessmentStatus).toHaveBeenCalledWith('project1');
        expect(assessmentService.startAssessment).toHaveBeenCalledWith('project1');
    });

    it('shows the no-project state without ever calling the assessment endpoints', async () => {
        vi.mocked(userService.getMyProjects).mockResolvedValue([]);

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.mode).toBe('no-project'));
        expect(assessmentService.fetchAssessmentStatus).not.toHaveBeenCalled();
        expect(assessmentService.startAssessment).not.toHaveBeenCalled();
    });

    it('opens the interview in the buddy thread when there is no placement', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 's1',
            question: 'Walk me through a recent PR.',
        });

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.mode).toBe('intake'));
        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].role).toBe('ASSISTANT');
        expect(result.current.messages[0].content).toBe('Walk me through a recent PR.');
    });

    it('goes straight to the mentor when the project has nothing to assess yet', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 's1',
            question: null,
            done: true,
        });

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.mode).toBe('mentor'));
        expect(result.current.messages).toHaveLength(0);
    });

    it('walks the interview turns in the same thread and flips to the mentor on done', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 's1',
            question: 'Q1',
        });
        vi.mocked(assessmentService.answerAssessment)
            .mockResolvedValueOnce({ done: false, question: 'Q2' })
            .mockResolvedValueOnce({ done: true, question: null });

        const { result } = renderHook(() => useBuddyIntake());
        await waitFor(() => expect(result.current.mode).toBe('intake'));

        act(() => result.current.setDraft('my first answer'));
        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(3));
        expect(result.current.messages[1].role).toBe('USER');
        expect(result.current.messages[1].content).toBe('my first answer');
        expect(result.current.messages[2].content).toBe('Q2');
        expect(assessmentService.answerAssessment).toHaveBeenCalledWith('s1', 'my first answer');

        act(() => result.current.setDraft('my second answer'));
        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
        });

        // The engine wrote the placement; the buddy takes it from here as the mentor.
        await waitFor(() => expect(result.current.mode).toBe('mentor'));
    });

    it('retries a failed start, and a failed answer resends the same answer', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment)
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue({ sessionId: 's1', question: 'Q1' });

        const { result } = renderHook(() => useBuddyIntake());

        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect(result.current.mode).toBe('loading');

        act(() => result.current.retry());
        await waitFor(() => expect(result.current.mode).toBe('intake'));

        vi.mocked(assessmentService.answerAssessment)
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue({ done: false, question: 'Q2' });

        act(() => result.current.setDraft('my answer'));
        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
        });
        await waitFor(() => expect(result.current.error).toBeTruthy());

        act(() => result.current.retry());
        await waitFor(() => expect(result.current.messages).toHaveLength(3));
        // Retried with the very answer that failed — and the user's bubble was not duplicated.
        expect(assessmentService.answerAssessment).toHaveBeenLastCalledWith('s1', 'my answer');
        expect(result.current.messages.filter(m => m.role === 'USER')).toHaveLength(1);
    });
});
