import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '../../../../src/components/common/ThemeToggle';
import * as useThemeHook from '../../../../src/context/useTheme';

describe('ThemeToggle', () => {
    it('renders Light Mode correctly', () => {
        vi.spyOn(useThemeHook, 'useTheme').mockReturnValue({
            theme: 'light',
            isDarkMode: false,
            toggleTheme: vi.fn(),
        });

        render(<ThemeToggle />);
        expect(screen.getByText('Light Mode')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders Dark Mode correctly and handles toggling', () => {
        const toggleMock = vi.fn();
        vi.spyOn(useThemeHook, 'useTheme').mockReturnValue({
            theme: 'dark',
            isDarkMode: true,
            toggleTheme: toggleMock,
        });

        render(<ThemeToggle />);
        expect(screen.getByText('Dark Mode')).toBeInTheDocument();
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        
        fireEvent.click(button);
        expect(toggleMock).toHaveBeenCalledOnce();
    });
});
