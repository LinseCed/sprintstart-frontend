/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TeamManagementPage } from '../../../src/pages/TeamManagementPage';
import { getTeamOverview, getProjectRoles } from '../../../src/services/teamManagementService';

vi.mock('../../../src/services/teamManagementService', () => ({
    getTeamOverview: vi.fn(),
    getProjectRoles: vi.fn(),
}));

describe('TeamManagementPage', () => {
    const mockUsers = [
        {
            userId: 'user1',
            firstname: 'Alice',
            lastname: 'Smith',
            roles: [{ id: 'role1', name: 'Backend' }],
            progressPercentage: 80,
            currentStep: { startedAt: '2023-01-01T10:00:00Z' },
            skills: []
        },
        {
            userId: 'user2',
            firstname: 'Bob',
            lastname: 'Jones',
            roles: [{ id: 'role2', name: 'Frontend' }],
            progressPercentage: 20,
            currentStep: { startedAt: '2023-01-02T10:00:00Z' }, // Started later, so step duration is shorter
            skills: []
        }
    ];

    const mockRoles = [
        { id: 'role1', name: 'Backend' },
        { id: 'role2', name: 'Frontend' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getTeamOverview).mockResolvedValue(mockUsers as any);
        vi.mocked(getProjectRoles).mockResolvedValue(mockRoles as any);
    });

    it('renders loading state initially', () => {
        vi.mocked(getTeamOverview).mockImplementation(() => new Promise(() => {}));
        render(<MemoryRouter><TeamManagementPage /></MemoryRouter>);
        expect(screen.getByText('Loading team overview...')).toBeInTheDocument();
    });

    it('renders members and roles after loading', async () => {
        render(<MemoryRouter><TeamManagementPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        });

        // 2 members total
        const memberCounts = screen.getAllByText('2');
        expect(memberCounts.length).toBeGreaterThan(0);
    });

    it('filters members by role', async () => {
        render(<MemoryRouter><TeamManagementPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        // The filter select is within TeamMemberFilters, we can change its value
        const selects = screen.getAllByRole('combobox');
        const roleSelect = selects[0]; // Assuming first select is Role filter
        
        fireEvent.change(roleSelect, { target: { value: 'role1' } });

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
        });
    });

    it('sorts members by progress', async () => {
        render(<MemoryRouter><TeamManagementPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        const selects = screen.getAllByRole('combobox');
        const sortSelect = selects[1]; // Assuming second select is Sort
        
        // Sort by LOWEST_PROGRESS
        fireEvent.change(sortSelect, { target: { value: 'LOWEST_PROGRESS' } });

        // Since it's ordered Bob (20%), Alice (80%), Bob should appear before Alice in the DOM structure
        await waitFor(() => {
            const nameElements = screen.getAllByText(/(Bob Jones|Alice Smith)/);
            const textContent = nameElements.map(el => el.textContent);
            expect(textContent).toEqual(['Bob Jones', 'Alice Smith']);
        });
    });
});
