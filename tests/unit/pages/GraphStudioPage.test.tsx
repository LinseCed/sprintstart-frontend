import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { GraphStudioPage } from '../../../src/pages/GraphStudioPage';
import { server } from '../setup/vitest.setup';

vi.mock('../../../src/features/projects/useProjectContext', async () => {
    const { createProjectContextValue, createSelectableProject } = await import(
        '../setup/projectContext'
    );
    return {
        useProjectContext: () =>
            createProjectContextValue({
                selectedProjectId: 'p1',
                projects: [createSelectableProject({ id: 'p1', name: 'Project One' })],
                selectedProject: createSelectableProject({ id: 'p1', name: 'Project One' }),
            }),
    };
});

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({
        profile: { permissionGroup: 'PM' },
        status: 'authenticated',
    }),
}));

const competency = (over: Record<string, unknown> = {}) => ({
    key: 'kotlin',
    label: 'Kotlin',
    description: null,
    kind: 'SKILL',
    area: null,
    targetLevel: 2,
    invariant: false,
    ...over,
});

function renderStudio(competencies: Record<string, unknown>[]) {
    server.use(
        http.get('/api/v1/onboarding/competency-graph', () =>
            HttpResponse.json({ competencies }),
        ),
        http.get('/api/v1/onboarding/competency-modules', () =>
            HttpResponse.json({ modules: [] }),
        ),
    );

    return render(
        <MemoryRouter>
            <GraphStudioPage />
        </MemoryRouter>,
    );
}

describe('GraphStudioPage', () => {
    /**
     * Pins that `area` has a reader. A field the generator populates and nothing groups by is
     * dead wiring.
     */
    it('groups the vocabulary under its areas', async () => {
        renderStudio([
            competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
            competency({ key: 'crawl', label: 'Crawling', area: 'Ingestion' }),
        ]);

        expect(await screen.findByRole('heading', { name: /Authentication/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Ingestion/ })).toBeInTheDocument();
    });

    it('names the ungrouped bucket for what is true about it', async () => {
        renderStudio([competency({ key: 'loose', label: 'Loose end' })]);

        // Not "General" or "Other" -- an invented area reads as a judgement somebody made.
        expect(await screen.findByRole('heading', { name: /Not grouped yet/ })).toBeInTheDocument();
    });

    it('narrows the list as you search', async () => {
        const user = userEvent.setup();
        renderStudio([
            competency({ key: 'jwt', label: 'JWT', area: 'Authentication' }),
            competency({ key: 'crawl', label: 'Crawling', area: 'Ingestion' }),
        ]);

        await waitFor(() => {
            expect(screen.getByText('Crawling')).toBeInTheDocument();
        });

        await user.type(screen.getByRole('searchbox'), 'jwt');

        expect(screen.getByText('JWT')).toBeInTheDocument();
        expect(screen.queryByText('Crawling')).not.toBeInTheDocument();
    });

    /**
     * "Connect a repository" is the right advice for an empty vocabulary and the wrong advice for
     * somebody with 200 competencies whose query matched none of them.
     */
    it('tells a fruitless search apart from an empty vocabulary', async () => {
        const user = userEvent.setup();
        renderStudio([competency({ label: 'Kotlin' })]);

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        await user.type(screen.getByRole('searchbox'), 'rust');

        expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
        expect(screen.queryByText(/connect a repository/i)).not.toBeInTheDocument();
    });

    it('still says how to get started when there is no vocabulary at all', async () => {
        renderStudio([]);

        expect(await screen.findByText('No competencies yet')).toBeInTheDocument();
        expect(screen.getByText(/connect a repository/i)).toBeInTheDocument();
    });
});
