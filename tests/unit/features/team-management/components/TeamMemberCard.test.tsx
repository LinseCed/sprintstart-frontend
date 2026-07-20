import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamMemberCard } from '../../../../../src/features/team-management/components/TeamMemberCard';
import type {
    TeamMemberCompetency,
    TeamOverviewUser
} from '../../../../../src/features/team-management/types';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../../src/components/common/UserAvatar', () => ({
    UserAvatar: () => <svg role="img" aria-label="User Avatar" width="40" height="40" />,
}));

function competency(overrides: Partial<TeamMemberCompetency> = {}): TeamMemberCompetency {
    return {
        competencyKey: 'kotlin',
        label: 'Kotlin',
        level: 3,
        source: 'VERIFIED',
        updatedAt: '2026-07-01T00:00:00Z',
        ...overrides
    };
}

function createUser(overrides: Partial<TeamOverviewUser> = {}): TeamOverviewUser {
    return {
        userId: 'u1',
        firstname: 'Alice',
        lastname: 'Smith',
        roles: [{ id: 'r1', name: 'Backend', description: '' }],
        competencies: [competency()],
        hasFeedback: false,
        projects: [{ id: 'proj1', name: 'Project 1' }],
        ...overrides,
    };
}

function renderCard(user = createUser()) {
    return render(
        <MemoryRouter>
            <TeamMemberCard user={user} />
        </MemoryRouter>,
    );
}

describe('TeamMemberCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the member name and roles', () => {
        renderCard();

        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('renders "No role assigned" when the user has no roles', () => {
        renderCard(createUser({ roles: [] }));

        expect(screen.getByText('No role assigned')).toBeInTheDocument();
    });

    it('counts competencies at or above the default bar as held', () => {
        renderCard(
            createUser({
                competencies: [
                    competency({ competencyKey: 'a', level: 2 }),
                    competency({ competencyKey: 'b', level: 4 }),
                    // Below the bar -- in progress, not held.
                    competency({ competencyKey: 'c', level: 1 })
                ]
            })
        );

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('competencies held')).toBeInTheDocument();
        expect(screen.getByText(/1 below target/)).toBeInTheDocument();
    });

    it('excludes level 0 from both held and in-progress', () => {
        // Level 0 is "asked, saw no competence" -- it is not partial progress.
        renderCard(
            createUser({
                competencies: [
                    competency({ competencyKey: 'a', level: 2 }),
                    competency({ competencyKey: 'b', level: 0 })
                ]
            })
        );

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.queryByText(/below target/)).not.toBeInTheDocument();
    });

    it('distinguishes verified competencies from merely assessed ones', () => {
        renderCard(
            createUser({
                competencies: [
                    competency({ competencyKey: 'a', level: 3, source: 'VERIFIED' }),
                    competency({ competencyKey: 'b', level: 3, source: 'ASSESSED' })
                ]
            })
        );

        // A passed check is a materially stronger claim than a self-placement.
        expect(screen.getByText(/1 verified by a passed check/)).toBeInTheDocument();
    });

    it('singularises a single held competency', () => {
        renderCard(createUser({ competencies: [competency({ level: 2 })] }));

        expect(screen.getByText('competency held')).toBeInTheDocument();
    });

    it('says so when the member has no ledger at all', () => {
        renderCard(createUser({ competencies: [] }));

        expect(screen.getByText('No assessment yet')).toBeInTheDocument();
    });

    it('shows the feedback badge when the user has feedback', () => {
        renderCard(createUser({ hasFeedback: true }));

        expect(screen.getByTitle('Unread onboarding feedback')).toBeInTheDocument();
    });

    it('renders as a link to the member detail page', () => {
        renderCard();

        expect(screen.getByRole('link')).toHaveAttribute('href', '/team/u1');
    });
});
