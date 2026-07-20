import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

/**
 * The phased journey under `/onboarding` is retired: `GET /me/path` serves the competency
 * `PathView` and the phases payload is PM-only, so the hire-facing journey page had no backend
 * left and returned a `400`. Old links must still land somewhere real.
 *
 * These mirror the redirect wiring in `AppRouter` without mounting the whole authenticated shell.
 */
function StepRedirect() {
    const { stepId } = useParams<{ stepId: string }>();
    return <Navigate to={`/my-path/module/${stepId ?? ''}`} replace />;
}

function LocationProbe() {
    const location = useLocation();
    return <p data-testid="location">{location.pathname}</p>;
}

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/onboarding" element={<Navigate to="/my-path" replace />} />
                <Route path="/onboarding/path" element={<Navigate to="/my-path" replace />} />
                <Route path="/onboarding/assessment" element={<LocationProbe />} />
                <Route path="/onboarding/:stepId" element={<StepRedirect />} />
                <Route path="/my-path" element={<LocationProbe />} />
                <Route path="/my-path/module/:stepId" element={<LocationProbe />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('retired onboarding routes', () => {
    it('sends the old journey page to the competency path', () => {
        renderAt('/onboarding');

        expect(screen.getByTestId('location')).toHaveTextContent('/my-path');
    });

    it('sends an old per-step link to the module that replaced it', () => {
        renderAt('/onboarding/step-123');

        expect(screen.getByTestId('location')).toHaveTextContent('/my-path/module/step-123');
    });

    it('keeps the previous competency-path redirect working', () => {
        renderAt('/onboarding/path');

        expect(screen.getByTestId('location')).toHaveTextContent('/my-path');
    });

    it('leaves the assessment where it is', () => {
        // The assessment is still the front door and is not part of the retired journey.
        renderAt('/onboarding/assessment');

        expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/assessment');
    });
});
