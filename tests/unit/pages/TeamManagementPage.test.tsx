import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TeamManagementPage } from '../../../src/pages/TeamManagementPage';
import { http } from 'msw';
import { server } from '../../unit/setup/vitest.setup';

describe('TeamManagementPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        server.use(
            http.get('/api/v1/onboarding/dashboard/users', () => {
                return new Promise<never>(() => {});
            }),
        );

        render(
            <MemoryRouter>
                <TeamManagementPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Loading team overview...')).toBeInTheDocument();
    });

    it('renders members and roles after loading', async () => {
        render(
            <MemoryRouter>
                <TeamManagementPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        });
    });

    it('filters members by role', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <TeamManagementPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[0], 'role1');

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
        });
    });

    it('sorts members by how many competencies they hold', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <TeamManagementPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        const selects = screen.getAllByRole('combobox');
        await user.selectOptions(selects[1], 'FEWEST_COMPETENCIES');

        await waitFor(() => {
            const nameElements = screen.getAllByText(/(Bob Jones|Alice Smith)/);
            const textContent = nameElements.map((el) => el.textContent);
            // Bob holds none, Alice holds one -- fewest first.
            expect(textContent).toEqual(['Bob Jones', 'Alice Smith']);
        });
    });
});
