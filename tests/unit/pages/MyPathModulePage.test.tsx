import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyPathModulePage } from '../../../src/pages/MyPathModulePage';

vi.mock('../../../src/services/onboardingService', () => ({
    onboardingService: { fetchStep: vi.fn() },
}));

vi.mock('../../../src/services/verificationService', () => ({
    verificationService: { fetchVerification: vi.fn(), submitVerificationAttempt: vi.fn() },
}));

import { onboardingService } from '../../../src/services/onboardingService';
import { verificationService } from '../../../src/services/verificationService';

const step = {
    id: 'step1',
    phaseId: 'phase1',
    position: 1,
    title: 'Ship your first change',
    description: 'A module',
    type: 'TASK',
    estimatedMinutes: 20,
    expectedOutcomes: [],
    tasks: [{ id: 't1', stepId: 'step1', position: 1, title: 'Clone the repo', description: '', finished: false }],
    resources: [],
    status: 'IN_PROGRESS',
    startedAt: null,
    completedAt: null,
    feedback: null,
    skip: null,
    content: 'Lesson body',
    pages: [
        { kind: 'LESSON', title: 'Learn', content: 'Lesson body' },
        { kind: 'TASK', title: 'Practice', content: null },
        { kind: 'VERIFY', title: 'Verify', content: null },
    ],
};

const verification = {
    id: 'v1',
    stepId: 'step1',
    type: 'KNOWLEDGE',
    prompt: 'Explain the deploy flow',
    competencyKey: 'deploy',
    level: 'APPLY',
};

/** Surfaces the router location so the return-to-map hand-off can be asserted. */
function LocationProbe() {
    const location = useLocation();
    return (
        <p>
            map:{location.pathname}:{(location.state as { unlockedKey?: string } | null)?.unlockedKey ?? 'none'}
        </p>
    );
}

function renderModule(initialEntry = '/my-path/module/step1') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/my-path" element={<LocationProbe />} />
                <Route path="/my-path/module/:stepId" element={<MyPathModulePage />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('MyPathModulePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(onboardingService.fetchStep).mockResolvedValue(step as never);
        vi.mocked(verificationService.fetchVerification).mockResolvedValue(verification as never);
    });

    it('renders the backend-provided pages behind a stepper', async () => {
        const user = userEvent.setup();
        renderModule();

        expect(await screen.findByText('Lesson body')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Practice/ }));
        expect(await screen.findByText('Clone the repo')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Verify/ }));
        expect(await screen.findByText('Explain the deploy flow')).toBeInTheDocument();
    });

    it('deep-links straight to a page via the query string', async () => {
        renderModule('/my-path/module/step1?page=2');

        expect(await screen.findByText('Explain the deploy flow')).toBeInTheDocument();
    });

    it('returns to the map with the earned competency key after passing', async () => {
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: true,
            score: 1,
            feedback: 'Correct',
            hint: null,
            attemptNo: 1,
            graphVersion: 3,
            stepStatus: 'FINISHED',
        } as never);

        const user = userEvent.setup();
        renderModule('/my-path/module/step1?page=2');

        await user.type(await screen.findByLabelText('Your answer'), 'Because it is');
        await user.click(screen.getByRole('button', { name: 'Submit answer' }));

        await waitFor(() => {
            expect(screen.getByTestId('module-passed')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /see what it unlocked/i }));

        expect(await screen.findByText('map:/my-path:deploy')).toBeInTheDocument();
    });

    it('shows a failed attempt with its hint and keeps the check open', async () => {
        vi.mocked(verificationService.submitVerificationAttempt).mockResolvedValue({
            attemptId: 'a1',
            stepId: 'step1',
            passed: false,
            score: 0.2,
            feedback: 'Missing the rollback step',
            hint: 'Think about what happens on failure',
            attemptNo: 1,
            graphVersion: 3,
            stepStatus: 'IN_PROGRESS',
        } as never);

        const user = userEvent.setup();
        renderModule('/my-path/module/step1?page=2');

        await user.type(await screen.findByLabelText('Your answer'), 'Not sure');
        await user.click(screen.getByRole('button', { name: 'Submit answer' }));

        expect(await screen.findByText(/missing the rollback step/i)).toBeInTheDocument();
        expect(screen.getByText(/think about what happens on failure/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit answer' })).toBeInTheDocument();
    });
});
