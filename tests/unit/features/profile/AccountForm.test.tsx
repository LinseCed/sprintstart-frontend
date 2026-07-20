import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AccountForm } from '../../../../src/features/profile/components/AccountForm';
import { http, HttpResponse } from 'msw';
import { server } from '../../setup/vitest.setup';
import { PermissionGroup, type UserProfile } from '../../../../src/services/types';

describe('AccountForm', () => {
    const mockUser: UserProfile = {
        id: '123',
        authId: 'auth-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        projectRoles: [],
        projectIds: [],
        permissionGroup: PermissionGroup.USER,
        enabled: true,
        profileIcon: null,
        hasCompletedOnboarding: true,
        githubLogin: null,
        githubLoginSource: null,
    };

    it('renders user information in inputs', () => {
        render(<AccountForm profile={mockUser} onUpdate={vi.fn()} />);

        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('lets a user declare the GitHub account their pull requests come from', async () => {
        const user = userEvent.setup();
        const onUpdateMock = vi.fn();

        render(<AccountForm profile={mockUser} onUpdate={onUpdateMock} />);

        await user.type(screen.getByLabelText('GitHub Username'), 'octocat');
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(onUpdateMock).toHaveBeenCalledWith(
                expect.objectContaining({ githubLogin: 'octocat' }),
            );
        });
    });

    it('clears the link when the username is emptied', async () => {
        const user = userEvent.setup();
        const onUpdateMock = vi.fn();

        render(
            <AccountForm profile={{ ...mockUser, githubLogin: 'octocat' }} onUpdate={onUpdateMock} />,
        );

        await user.clear(screen.getByLabelText('GitHub Username'));
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ githubLogin: '' }));
        });
    });

    it('submits form and calls onUpdate', async () => {
        const user = userEvent.setup();
        const onUpdateMock = vi.fn();

        server.use(
            http.patch('/api/v1/users/me', async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({
                    id: '123',
                    authId: 'auth-1',
                    username: 'johndoe',
                    email: body.email as string,
                    firstName: body.firstName as string,
                    lastName: 'Doe',
                    projectRoles: [],
                    projectIds: [],
                    permissionGroup: 'USER',
                    enabled: true,
                    profileIcon: null,
                    hasCompletedOnboarding: true,
                    githubLogin: null,
                    githubLoginSource: null,
                });
            }),
        );

        render(<AccountForm profile={mockUser} onUpdate={onUpdateMock} />);

        const firstNameInput = screen.getByDisplayValue('John');
        await user.clear(firstNameInput);
        await user.type(firstNameInput, 'Jane');

        await user.click(screen.getByText('Save Changes'));

        await waitFor(
            () => {
                expect(onUpdateMock).toHaveBeenCalledWith(
                    expect.objectContaining({ firstName: 'Jane' }),
                );
            },
            { timeout: 3000 },
        );
    });

    it('handles form submission error', async () => {
        const user = userEvent.setup();

        server.use(
            http.patch('/api/v1/users/me', () => HttpResponse.error()),
        );

        render(<AccountForm profile={mockUser} onUpdate={vi.fn()} />);

        await user.click(screen.getByText('Save Changes'));

        await waitFor(
            () => {
                expect(screen.getByText('Save Changes')).not.toBeDisabled();
            },
            { timeout: 3000 },
        );
    });
});
