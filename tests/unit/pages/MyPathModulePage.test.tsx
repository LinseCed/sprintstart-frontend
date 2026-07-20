import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyPathModulePage } from '../../../src/pages/MyPathModulePage';

vi.mock('../../../src/services/competencyModuleService', () => ({
    competencyModuleService: {
        fetchModule: vi.fn(),
        fetchVerification: vi.fn(),
        submitAttempt: vi.fn(),
    },
}));

import { competencyModuleService } from '../../../src/services/competencyModuleService';

const page = (id: string, kind: string, title: string, body: string | null) => ({
    id,
    kind,
    title,
    body,
    position: 0,
    provenance: 'AI',
    updatedAt: '2026-07-20T10:00:00Z',
});

const module = {
    id: 'm1',
    competencyKey: 'deploy',
    competencyLabel: 'Deploy the service',
    projectId: 'p1',
    version: 1,
    status: 'ACTIVE',
    origin: 'AI',
    title: 'Deploying',
    summary: 'How deploys work here.',
    pages: [
        page('pg-context', 'CONTEXT', 'Why it matters', 'Deploys are gated because...'),
        page('pg-lesson', 'LESSON', 'How it works', 'Lesson body'),
        page('pg-walk', 'WALKTHROUGH', 'Trace a deploy', 'Step by step'),
        page('pg-verify', 'VERIFY', 'Verify', null),
    ],
    verificationType: 'KNOWLEDGE',
    updatedAt: '2026-07-20T10:00:00Z',
};

const verification = {
    id: 'v1',
    moduleId: 'm1',
    type: 'KNOWLEDGE',
    prompt: 'Explain the deploy flow',
    competencyKey: 'deploy',
    level: 'intermediate',
};

/** Surfaces the router location so the return-to-map hand-off can be asserted. */
function LocationProbe() {
    const location = useLocation();
    return (
        <p>
            map:{location.pathname}:
            {(location.state as { unlockedKey?: string } | null)?.unlockedKey ?? 'none'}
        </p>
    );
}

function renderModule(initialEntry = '/my-path/module/m1') {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route path="/my-path" element={<LocationProbe />} />
                <Route path="/my-path/module/:moduleId" element={<MyPathModulePage />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('MyPathModulePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(competencyModuleService.fetchModule).mockResolvedValue(module as never);
        vi.mocked(competencyModuleService.fetchVerification).mockResolvedValue(verification as never);
    });

    it('renders each page kind deliberately, behind a stepper', async () => {
        const user = userEvent.setup();
        renderModule();

        // First page wins when no page is requested.
        expect(await screen.findByText(/deploys are gated because/i)).toBeInTheDocument();
        expect(screen.getByText(/why this matters/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /How it works/ }));
        expect(await screen.findByText('Lesson body')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Trace a deploy/ }));
        expect(await screen.findByText(/walkthrough/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Verify/ }));
        expect(await screen.findByText('Explain the deploy flow')).toBeInTheDocument();
    });

    it('renders an unknown page kind visibly rather than as a blank page', async () => {
        vi.mocked(competencyModuleService.fetchModule).mockResolvedValue({
            ...module,
            pages: [page('pg-new', 'SIMULATION', 'Try the simulator', 'Body of the new kind')],
        } as never);

        renderModule();

        expect(await screen.findByTestId('unknown-page-kind')).toBeInTheDocument();
        // The content a hire may be graded on is still shown.
        expect(screen.getByText('Body of the new kind')).toBeInTheDocument();
    });

    it('still renders the pages when no check is configured yet', async () => {
        vi.mocked(competencyModuleService.fetchVerification).mockRejectedValue(new Error('404'));

        renderModule();

        expect(await screen.findByText(/deploys are gated because/i)).toBeInTheDocument();
    });

    it('surfaces a failed load instead of rendering placeholder content', async () => {
        vi.mocked(competencyModuleService.fetchModule).mockRejectedValue(
            new Error('Module not found'),
        );

        renderModule();

        expect(await screen.findByText('Module not found')).toBeInTheDocument();
        expect(screen.queryByText('Lesson body')).not.toBeInTheDocument();
    });

    it('deep-links to a page by id, so the link survives a reorder', async () => {
        renderModule('/my-path/module/m1?page=pg-verify');

        expect(await screen.findByText('Explain the deploy flow')).toBeInTheDocument();
    });

    it('falls back to the first page when the deep-linked page is gone', async () => {
        renderModule('/my-path/module/m1?page=pg-deleted');

        expect(await screen.findByText(/deploys are gated because/i)).toBeInTheDocument();
    });

    it('returns to the map with the earned competency key after passing', async () => {
        vi.mocked(competencyModuleService.submitAttempt).mockResolvedValue({
            attemptId: 'a1',
            moduleId: 'm1',
            passed: true,
            score: 1,
            feedback: 'Correct',
            hint: null,
            attemptNo: 1,
            graphVersion: 3,
        });

        const user = userEvent.setup();
        renderModule('/my-path/module/m1?page=pg-verify');

        await user.type(await screen.findByLabelText('Your answer'), 'Because it is');
        await user.click(screen.getByRole('button', { name: 'Submit answer' }));

        await waitFor(() => {
            expect(screen.getByTestId('module-passed')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /see what it unlocked/i }));

        expect(await screen.findByText('map:/my-path:deploy')).toBeInTheDocument();
    });

    it('shows a failed attempt with its hint and keeps the check open', async () => {
        vi.mocked(competencyModuleService.submitAttempt).mockResolvedValue({
            attemptId: 'a1',
            moduleId: 'm1',
            passed: false,
            score: 0.2,
            feedback: 'Missing the rollback step',
            hint: 'Think about what happens on failure',
            attemptNo: 1,
            graphVersion: 3,
        });

        const user = userEvent.setup();
        renderModule('/my-path/module/m1?page=pg-verify');

        await user.type(await screen.findByLabelText('Your answer'), 'Not sure');
        await user.click(screen.getByRole('button', { name: 'Submit answer' }));

        expect(await screen.findByText(/missing the rollback step/i)).toBeInTheDocument();
        expect(screen.getByText(/think about what happens on failure/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit answer' })).toBeInTheDocument();
    });
});
