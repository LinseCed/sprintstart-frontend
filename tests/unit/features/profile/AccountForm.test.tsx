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
        githubLoginVerification: null,
        githubLoginVerifiedAt: null,
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

    /**
     * The login is what artifact verification compares a pull request's author against, so a typo
     * does not fail loudly — it silently stops crediting work the hire really did. This is the one
     * place it can be caught before that happens.
     */
    it('warns when GitHub says the declared account does not exist', () => {
        render(
            <AccountForm
                profile={{
                    ...mockUser,
                    githubLogin: 'octocatt',
                    githubLoginVerification: 'NOT_FOUND',
                    githubLoginVerifiedAt: '2026-08-02T10:00:00Z',
                }}
                onUpdate={vi.fn()}
            />,
        );

        expect(screen.getByText(/no account called/i)).toBeInTheDocument();
    });

    /**
     * ⚠️ Null is not a negative. It covers never-checked, GitHub-would-not-say and
     * nothing-declared, and rendering any of them as "not found" tells somebody their perfectly
     * good username does not exist.
     */
    it('says nothing at all when nobody has an answer yet', () => {
        render(
            <AccountForm
                profile={{ ...mockUser, githubLogin: 'octocat' }}
                onUpdate={vi.fn()}
            />,
        );

        expect(screen.queryByText(/no account called/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/found on github/i)).not.toBeInTheDocument();
    });

    it('confirms a verified account without claiming it is theirs', () => {
        render(
            <AccountForm
                profile={{
                    ...mockUser,
                    githubLogin: 'octocat',
                    githubLoginVerification: 'VERIFIED',
                    githubLoginVerifiedAt: '2026-08-02T10:00:00Z',
                }}
                onUpdate={vi.fn()}
            />,
        );

        expect(screen.getByText(/not that it is yours/i)).toBeInTheDocument();
    });

    /**
     * A verdict is about a *value*. Leaving it up while somebody types the correction shows "we
     * could not find that account" against the account that fixes it.
     */
    it('withdraws the verdict as soon as the username is edited', async () => {
        const user = userEvent.setup();

        render(
            <AccountForm
                profile={{
                    ...mockUser,
                    githubLogin: 'octocatt',
                    githubLoginVerification: 'NOT_FOUND',
                    githubLoginVerifiedAt: '2026-08-02T10:00:00Z',
                }}
                onUpdate={vi.fn()}
            />,
        );
        expect(screen.getByText(/no account called/i)).toBeInTheDocument();

        await user.clear(screen.getByLabelText('GitHub Username'));
        await user.type(screen.getByLabelText('GitHub Username'), 'octocat');

        expect(screen.queryByText(/no account called/i)).not.toBeInTheDocument();
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
