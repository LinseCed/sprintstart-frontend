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
        },
        {
            key: 'our-domain-model',
            label: 'Our domain model',
            description: 'How entities are mapped here',
            kind: 'CONCEPT',
            targetLevel: 2,
            invariant: false,
        },
    ],
};

function renderStudio() {
    server.use(
        http.get('/api/v1/onboarding/competency-graph', () => HttpResponse.json(liveGraph)),
        http.get('/api/v1/onboarding/competency-modules', () => HttpResponse.json({ modules: [] }))
    );

    return render(
        <MemoryRouter>
            <GraphStudioPage />
        </MemoryRouter>
    );
}

describe('GraphStudioPage Accessibility', () => {
    it('has no axe violations with a populated vocabulary', async () => {
        const { baseElement } = renderStudio();

        await waitFor(() => {
            expect(screen.getByTestId('competency-list')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no axe violations with a competency selected', async () => {
        const user = userEvent.setup();
        const { baseElement } = renderStudio();

        await waitFor(() => {
            expect(screen.getByTestId('competency-list')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Our domain model'));

        expect(await screen.findByTestId('studio-node-panel')).toBeInTheDocument();
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
