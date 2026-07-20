import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { GraphStudioPage } from '../../../src/pages/GraphStudioPage';
import { server } from '../setup/vitest.setup';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({
        profile: {
            id: 'user1',
            authId: 'auth-1',
            username: 'pm',
            email: 'pm@example.com',
            firstName: 'PM',
            lastName: 'User',
            projectRoles: [],
            permissionGroup: 'PM',
            enabled: true,
            profileIcon: null,
            hasCompletedOnboarding: true,
        },
        status: 'authenticated',
    }),
}));

const liveGraph = {
    competencies: [
        {
            key: 'kotlin',
            label: 'Kotlin',
            description: 'Primary backend language',
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false,
            repoRef: 'build.gradle.kts',
        },
    ],
    edges: [],
    graphVersion: 3,
};

const proposedResponse = {
    competencies: [
        {
            id: 'c1',
            key: 'jpa-persistence',
            label: 'JPA persistence',
            description: 'How entities are mapped here',
            kind: 'CONCEPT',
            repoRef: null,
            status: 'PROPOSED',
        },
    ],
    edges: [
        {
            id: 'e1',
            fromKey: 'kotlin',
            toKey: 'jpa-persistence',
            kind: 'PREREQUISITE',
            rationale: 'Domain model relies on JPA entities',
            status: 'PROPOSED',
        },
    ],
};

function renderStudio() {
    server.use(
        http.get('/api/v1/onboarding/competency-graph', () => HttpResponse.json(liveGraph)),
        http.get('/api/v1/onboarding/competency-graph/proposed', () =>
            HttpResponse.json(proposedResponse)
        ),
        http.get('/api/v1/onboarding/competency-modules', () => HttpResponse.json({ modules: [] }))
    );

    return render(
        <MemoryRouter>
            <GraphStudioPage />
        </MemoryRouter>
    );
}

describe('GraphStudioPage Accessibility', () => {
    it('has no axe violations with a populated graph', async () => {
        const { baseElement } = renderStudio();

        await waitFor(() => {
            expect(screen.getByTestId('studio-graph')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no axe violations with the proposal review open', async () => {
        const user = userEvent.setup();
        const { baseElement } = renderStudio();

        await waitFor(() => {
            expect(screen.getByTestId('studio-graph')).toBeInTheDocument();
        });

        await user.click(screen.getByTestId('open-review'));

        // The proposal appears twice on purpose: as a dashed ghost on the canvas
        // and as a row in the review drawer.
        expect(await screen.findByTestId('proposal-review')).toBeInTheDocument();
        expect(await screen.findAllByText('JPA persistence')).toHaveLength(2);
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
