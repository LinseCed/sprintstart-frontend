import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearnVerifyModuleModal } from '../../../../src/features/learn-verify/components/LearnVerifyModuleModal';
import type { PathNode, PathView } from '../../../../src/features/skill-assessment/types';

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
    content: 'Kotlin is **null-safe**.'
};

function node(overrides: Partial<PathNode> = {}): PathNode {
    return { key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'available', stepId: 'step1', ...overrides };
}

function path(overrides: Partial<PathView> = {}): PathView {
    return {
        nodes: [node(), { key: 'domain-model', label: 'Domain Model', kind: 'CONCEPT', state: 'locked' }],
        edges: [{ from: 'kotlin', to: 'domain-model' }],
        graphVersion: 1,
        ...overrides
    };
}

describe('LearnVerifyModuleModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(onboardingService.fetchStep).mockResolvedValue(mockStep);
    });

    it('renders the Frame, Learn, and Verify zones for a KNOWLEDGE check', async () => {
        vi.mocked(verificationService.fetchVerification).mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'KNOWLEDGE',
            prompt: 'Why is Kotlin null-safe?',
            competencyKey: 'kotlin',
            level: 'beginner'
        });

        render(<LearnVerifyModuleModal node={node()} path={path()} onClose={vi.fn()} />);

        expect(await screen.findByText('Why is Kotlin null-safe?')).toBeInTheDocument();
        expect(screen.getByText('null-safe', { exact: false, selector: 'strong' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /your answer/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /skip to the check/i })).toBeInTheDocument();
    });

    it('renders a checkbox for an ATTEST check', async () => {
        vi.mocked(verificationService.fetchVerification).mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'ATTEST',
            prompt: 'Confirm you set this up.',
            competencyKey: 'kotlin',
            level: 'beginner'
        });

        render(<LearnVerifyModuleModal node={node()} path={path()} onClose={vi.fn()} />);

        expect(await screen.findByRole('checkbox')).toBeInTheDocument();
    });

    it('shows a mastered summary with no Verify form for an already-mastered node', async () => {
        vi.mocked(verificationService.fetchVerification).mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'KNOWLEDGE',
            prompt: 'Why is Kotlin null-safe?',
            competencyKey: 'kotlin',
            level: 'beginner'
        });

        render(
            <LearnVerifyModuleModal node={node({ state: 'mastered' })} path={path()} onClose={vi.fn()} />
        );

        expect(await screen.findByText(/already mastered/i)).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: /your answer/i })).not.toBeInTheDocument();
    });

    it('shows the payoff message with unlocked dependents on a passing submission', async () => {
        vi.mocked(verificationService.fetchVerification).mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'EXACT',
            prompt: 'Which database?',
            competencyKey: 'kotlin',
            level: 'beginner'
        });
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: true,
            score: 1,
            feedback: 'Matches exactly.',
            hint: null,
            attemptNo: 1,
            graphVersion: 1,
            stepStatus: 'FINISHED'
        });
        const user = userEvent.setup();

        render(<LearnVerifyModuleModal node={node()} path={path()} onClose={vi.fn()} />);

        const input = await screen.findByRole('textbox', { name: /your answer/i });
        await user.type(input, 'Chroma');
        await user.click(screen.getByRole('button', { name: /submit answer/i }));

        await waitFor(() => expect(screen.getByText('Mastered!')).toBeInTheDocument());
        expect(screen.getByText(/Domain Model/)).toBeInTheDocument();
    });

    it('calls onClose with submittedAttempt and passed when Done is clicked after passing', async () => {
        vi.mocked(verificationService.fetchVerification).mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'EXACT',
            prompt: 'Which database?',
            competencyKey: 'kotlin',
            level: 'beginner'
        });
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: true,
            score: 1,
            feedback: 'Matches exactly.',
            hint: null,
            attemptNo: 1,
            graphVersion: 1,
            stepStatus: 'FINISHED'
        });
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(<LearnVerifyModuleModal node={node()} path={path()} onClose={onClose} />);

        const input = await screen.findByRole('textbox', { name: /your answer/i });
        await user.type(input, 'Chroma');
        await user.click(screen.getByRole('button', { name: /submit answer/i }));
        await waitFor(() => expect(screen.getByRole('button', { name: /^done$/i })).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: /^done$/i }));

        expect(onClose).toHaveBeenCalledWith({ submittedAttempt: true, passed: true });
    });
});
