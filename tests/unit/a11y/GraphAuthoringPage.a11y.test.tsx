import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { GraphAuthoringPage } from '../../../src/pages/GraphAuthoringPage';
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

const proposedResponse = {
    competencies: [
        {
            id: 'c1',
            key: 'kotlin',
            label: 'Kotlin',
            description: 'Primary backend language',
            kind: 'SKILL',
            repoRef: 'build.gradle.kts',
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

describe('GraphAuthoringPage Accessibility', () => {
    it('has no axe violations with a populated proposal list', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () => HttpResponse.json(proposedResponse)),
        );

        const { baseElement } = render(<GraphAuthoringPage />);

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no axe violations with the reject-confirm panel open', async () => {
        server.use(
            http.get('/api/v1/onboarding/competency-graph/proposed', () => HttpResponse.json(proposedResponse)),
        );

        const user = userEvent.setup();
        const { baseElement } = render(<GraphAuthoringPage />);

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        const rejectButtons = screen.getAllByRole('button', { name: 'Reject' });
        await user.click(rejectButtons[0]);

        expect(await screen.findByText('Confirm reject')).toBeInTheDocument();
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
