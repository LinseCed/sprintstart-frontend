import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

/**
 * There are no hire-facing structured onboarding pages: onboarding is one conversation, so the
 * phased journey, First Week, and the competency map all resolve to the buddy. Old links must
 * still land somewhere real.
 *
 * These mirror the redirect wiring in `AppRouter` without mounting the whole authenticated shell.
 */
function LocationProbe() {
    const location = useLocation();
    return <p data-testid="location">{location.pathname}</p>;
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/onboarding" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/path" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/assessment" element={<Navigate to="/buddy" replace />} />
                <Route path="/onboarding/:stepId" element={<Navigate to="/buddy" replace />} />
                <Route path="/first-week" element={<Navigate to="/buddy" replace />} />
                <Route path="/my-path" element={<Navigate to="/buddy" replace />} />
                <Route path="/my-path/module/:moduleId" element={<Navigate to="/buddy" replace />} />
                <Route path="/buddy" element={<LocationProbe />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('retired hire routes', () => {
    it('sends the old journey page to the buddy', () => {
        renderAt('/onboarding');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends an old per-step link to the buddy', () => {
        renderAt('/onboarding/step-123');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends the old competency-path redirect to the buddy', () => {
        renderAt('/onboarding/path');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends First Week to the buddy', () => {
        renderAt('/first-week');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends My Path to the buddy', () => {
        renderAt('/my-path');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends an old module deep link to the buddy', () => {
        renderAt('/my-path/module/m1');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });

    it('sends the standalone assessment page to the buddy', () => {
        // The placement interview is the buddy's first conversation now — the page
        // that hosted it is retired, and /buddy enters intake mode for a hire with
        // no placement.
        renderAt('/onboarding/assessment');

        expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
    });
});
