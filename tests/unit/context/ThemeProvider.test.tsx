/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../../../src/context/ThemeProvider';
import { ThemeContext } from '../../../src/context/ThemeContext';
import { useContext } from 'react';

// A test component to consume the theme context
function TestComponent() {
    const { theme, toggleTheme, isDarkMode } = useContext(ThemeContext)!;
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="isDarkMode">{isDarkMode.toString()}</span>
            <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.className = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes with light theme if nothing in localStorage or system prefs', () => {
        // Mock matchMedia for light theme
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
            } as unknown as MediaQueryList)),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme')).toHaveTextContent('light');
        expect(screen.getByTestId('isDarkMode')).toHaveTextContent('false');
        expect(document.documentElement).toHaveClass('light');
    });

    it('initializes with dark theme if system prefers dark', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: true,
                media: query,
            } as unknown as MediaQueryList)),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveClass('dark');
    });

    it('initializes with stored theme over system prefs', () => {
        window.localStorage.setItem('theme', 'dark');
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false, // system is light
                media: query,
            })),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveClass('dark');
    });

    it('toggles theme and updates document class and localStorage', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
            } as unknown as MediaQueryList)),
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme')).toHaveTextContent('light');
        expect(document.documentElement).toHaveClass('light');

        fireEvent.click(screen.getByTestId('toggle-btn'));

        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveClass('dark');
        expect(document.documentElement).not.toHaveClass('light');
        expect(window.localStorage.getItem('theme')).toBe('dark');
    });
});
