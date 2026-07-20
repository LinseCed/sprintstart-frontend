import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { TeamMemberCard } from '../../../src/features/team-management/components/TeamMemberCard';
import type { TeamOverviewUser } from '../../../src/features/team-management/types';

vi.mock('../../../src/components/common/UserAvatar', () => ({
    UserAvatar: () => <svg role="img" aria-label="User Avatar" width="40" height="40" />
}));

const user: TeamOverviewUser = {
    userId: 'u1',
    firstname: 'Alice',
    lastname: 'Smith',
    roles: [{ id: 'r1', name: 'Developer', description: '' }],
    competencies: [
        {
            competencyKey: 'kotlin',
            label: 'Kotlin',
            level: 3,
            source: 'VERIFIED' as const,
            updatedAt: '2026-07-01T00:00:00Z'
        }
    ],
    projects: [{ id: 'p1', name: 'SprintStart' }],
    hasFeedback: false
};

describe('TeamMemberCard Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <TeamMemberCard user={user} />
                </main>
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /Alice Smith/ })).toBeInTheDocument();

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
