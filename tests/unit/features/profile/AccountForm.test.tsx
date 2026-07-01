/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountForm } from '../../../../src/features/profile/components/AccountForm';
import { userService } from '../../../../src/services/userService';

vi.mock('../../../../src/services/userService', () => ({
    userService: {
        updateProfile: vi.fn(),
    }
}));

describe('AccountForm', () => {
    const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        projectRoles: [],
    } as any;

    it('renders user information in inputs', () => {
        render(<AccountForm profile={mockUser} onUpdate={vi.fn()} />);

        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('handles form submission successfully', async () => {
        const onUpdateMock = vi.fn();
        vi.mocked(userService.updateProfile).mockResolvedValue({ ...mockUser, firstName: 'Jane' });

        render(<AccountForm profile={mockUser} onUpdate={onUpdateMock} />);

        const firstNameInput = screen.getByDisplayValue('John');
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Saving...')).toBeInTheDocument();

        await waitFor(() => {
            expect(onUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
                firstName: 'Jane'
            }));
        });
    });

    it('handles form submission error', async () => {
        vi.mocked(userService.updateProfile).mockRejectedValue(new Error('Update failed'));

        render(<AccountForm profile={mockUser} onUpdate={vi.fn()} />);

        const submitButton = screen.getByText('Save Changes');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });
});
