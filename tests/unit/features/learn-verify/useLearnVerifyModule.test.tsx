import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLearnVerifyModule } from '../../../../src/features/learn-verify/hooks/useLearnVerifyModule';
import { ApiError } from '../../../../src/services/apiClient';

vi.mock('../../../../src/services/onboardingService', () => ({
    onboardingService: {
        fetchStep: vi.fn()
    }
}));

vi.mock('../../../../src/services/verificationService', () => ({
    verificationService: {
        fetchVerification: vi.fn(),
        submitVerificationAttempt: vi.fn()
    }
}));

import { onboardingService } from '../../../../src/services/onboardingService';
import { verificationService } from '../../../../src/services/verificationService';

const mockStep = {
    id: 'step1',
    phaseId: 'phase1',
    position: 1,
    title: 'Learn Kotlin',
    description: 'd',
    type: 'DOCUMENT' as const,
    estimatedMinutes: 15,
    expectedOutcomes: [],
    tasks: [],
    resources: [],
    status: 'WAITING' as const,
    startedAt: null,
    completedAt: null,
    feedback: null,
    skip: null,
    content: 'Kotlin is null-safe.'
};

const mockVerification = {
    id: 'v1',
    stepId: 'step1',
    type: 'KNOWLEDGE' as const,
    prompt: 'Why is Kotlin null-safe?',
    competencyKey: 'kotlin',
    level: 'beginner'
};

describe('useLearnVerifyModule', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(onboardingService.fetchStep).mockResolvedValue(mockStep);
        vi.mocked(verificationService.fetchVerification).mockResolvedValue(mockVerification);
    });

    it('loads the step and verification config', async () => {
        const { result } = renderHook(() => useLearnVerifyModule('step1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.step?.content).toBe('Kotlin is null-safe.');
        expect(result.current.verification?.prompt).toBe('Why is Kotlin null-safe?');
        expect(result.current.loadError).toBeNull();
    });

    it('sets a load error when the verification config cannot be loaded', async () => {
        vi.mocked(verificationService.fetchVerification).mockRejectedValue(new Error('not found'));

        const { result } = renderHook(() => useLearnVerifyModule('step1'));

        await waitFor(() => expect(result.current.loadError).not.toBeNull());
    });

    it('submitting a passing answer appends the result and flips passed', async () => {
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: true,
            score: 0.9,
            feedback: 'Good.',
            hint: null,
            attemptNo: 1,
            graphVersion: 1,
            stepStatus: 'FINISHED'
        });

        const { result } = renderHook(() => useLearnVerifyModule('step1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => result.current.setAnswer('because types are non-nullable by default'));
        await act(() => result.current.submit());

        expect(result.current.passed).toBe(true);
        expect(result.current.attempts).toHaveLength(1);
        expect(result.current.answer).toBe('');
    });

    it('submitting a failing answer keeps the modal open and surfaces the hint', async () => {
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: false,
            score: 0,
            feedback: 'Too vague.',
            hint: 'Think about compile-time checks.',
            attemptNo: 1,
            graphVersion: 1,
            stepStatus: 'WAITING'
        });

        const { result } = renderHook(() => useLearnVerifyModule('step1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => result.current.setAnswer('idk'));
        await act(() => result.current.submit());

        expect(result.current.passed).toBe(false);
        expect(result.current.latestAttempt?.hint).toBe('Think about compile-time checks.');
    });

    it('surfaces a distinct message when grading is unavailable (503)', async () => {
        vi.mocked(verificationService.submitVerificationAttempt).mockRejectedValue(new ApiError(503, 'unavailable'));

        const { result } = renderHook(() => useLearnVerifyModule('step1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => result.current.setAnswer('an answer'));
        await act(() => result.current.submit());

        expect(result.current.gradingUnavailable).toBe(true);
        expect(result.current.submitError).toBeNull();
    });

    it('does not submit a blank answer', async () => {
        const { result } = renderHook(() => useLearnVerifyModule('step1'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.submit());

        expect(verificationService.submitVerificationAttempt).not.toHaveBeenCalled();
    });
});
