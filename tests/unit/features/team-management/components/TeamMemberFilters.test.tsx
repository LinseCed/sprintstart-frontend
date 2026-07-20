import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamMemberFilters } from '../../../../../src/features/team-management/components/TeamMemberFilters';
import type { ProjectRole, TeamOverviewFilters } from '../../../../../src/features/team-management/types';

const mockRoles: ProjectRole[] = [
    { id: 'r1', name: 'Backend', description: '' },
    { id: 'r2', name: 'Frontend', description: '' },
];

const defaultFilters: TeamOverviewFilters = {
    roleId: 'all',
    sortBy: 'FEWEST_COMPETENCIES',
};

describe('TeamMemberFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the role filter with all roles', () => {
        render(<TeamMemberFilters roles={mockRoles} filters={defaultFilters} onFiltersChange={vi.fn()} />);

        const roleSelect = screen.getByRole('combobox', { name: 'Filter team members by role' });
        expect(roleSelect).toBeInTheDocument();
        expect(screen.getByText('All roles')).toBeInTheDocument();
        expect(screen.getByText('Backend')).toBeInTheDocument();
        expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    it('renders the sort-by select with sort options', () => {
        render(<TeamMemberFilters roles={mockRoles} filters={defaultFilters} onFiltersChange={vi.fn()} />);

        const sortSelect = screen.getByRole('combobox', { name: 'Sort team members' });
        expect(sortSelect).toBeInTheDocument();
        expect(screen.getByText('Most competencies')).toBeInTheDocument();
        expect(screen.getByText('Fewest competencies')).toBeInTheDocument();
        expect(screen.getByText('Recently active')).toBeInTheDocument();
    });

    it('calls onFiltersChange with new roleId when role is changed', async () => {
        const user = userEvent.setup();
        const onFiltersChange = vi.fn();
        render(<TeamMemberFilters roles={mockRoles} filters={defaultFilters} onFiltersChange={onFiltersChange} />);

        await user.selectOptions(screen.getByRole('combobox', { name: 'Filter team members by role' }), 'r1');

        expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, roleId: 'r1' });
    });

    it('calls onFiltersChange with new sortBy when sort is changed', async () => {
        const user = userEvent.setup();
        const onFiltersChange = vi.fn();
        render(<TeamMemberFilters roles={mockRoles} filters={defaultFilters} onFiltersChange={onFiltersChange} />);

        await user.selectOptions(screen.getByRole('combobox', { name: 'Sort team members' }), 'MOST_COMPETENCIES');

        expect(onFiltersChange).toHaveBeenCalledWith({ ...defaultFilters, sortBy: 'MOST_COMPETENCIES' });
    });

    it('reflects the current filter values in the selects', () => {
        const filters: TeamOverviewFilters = { roleId: 'r2', sortBy: 'RECENTLY_ACTIVE' };
        render(<TeamMemberFilters roles={mockRoles} filters={filters} onFiltersChange={vi.fn()} />);

        expect(screen.getByRole('combobox', { name: 'Filter team members by role' })).toHaveDisplayValue('Frontend');
        expect(screen.getByRole('combobox', { name: 'Sort team members' })).toHaveDisplayValue('Recently active');
    });
});
