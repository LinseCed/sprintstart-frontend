import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { LearnVerifyModuleModal } from '../../../src/features/learn-verify/components/LearnVerifyModuleModal';
import type { PathNode, PathView } from '../../../src/features/skill-assessment/types';

vi.mock('../../../src/services/onboardingService', () => ({
    onboardingService: {
        fetchStep: vi.fn().mockResolvedValue({
            id: 'step1',
            phaseId: 'phase1',
            position: 1,
            title: 'Learn Kotlin',
            description: 'd',
            type: 'DOCUMENT',
            estimatedMinutes: 15,
            expectedOutcomes: [],
            tasks: [],
            resources: [],
            status: 'WAITING',
            startedAt: null,
            completedAt: null,
            feedback: null,
            skip: null,
            content: 'Kotlin is null-safe.'
        })
    }
}));

vi.mock('../../../src/services/verificationService', () => ({
    verificationService: {
        fetchVerification: vi.fn().mockResolvedValue({
            id: 'v1',
            stepId: 'step1',
            type: 'KNOWLEDGE',
            prompt: 'Why is Kotlin null-safe?',
            competencyKey: 'kotlin',
            level: 'beginner'
        }),
        submitVerificationAttempt: vi.fn()
    }
}));

const node: PathNode = { key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'available', stepId: 'step1' };
const path: PathView = { nodes: [node], edges: [], graphVersion: 1 };

describe('LearnVerifyModuleModal Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(<LearnVerifyModuleModal node={node} path={path} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Why is Kotlin null-safe?')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
