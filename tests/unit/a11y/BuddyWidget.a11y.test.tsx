import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { http, HttpResponse } from 'msw';
import { BuddyWidget } from '../../../src/features/buddy/components/BuddyWidget';
import { server } from '../setup/vitest.setup';

describe('BuddyWidget Accessibility', () => {
    it('has no axe violations when closed', async () => {
        const { baseElement } = render(
            <main>
                <BuddyWidget />
            </main>,
        );

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no axe violations when opened', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/buddy/messages', () =>
                HttpResponse.json([
                    { role: 'USER', content: 'hi', createdAt: '2026-07-18T00:00:00.000Z' },
                    { role: 'ASSISTANT', content: 'hello!', createdAt: '2026-07-18T00:00:01.000Z' },
                ]),
            ),
        );

        const user = userEvent.setup();
        const { baseElement } = render(
            <main>
                <BuddyWidget />
            </main>,
        );

        await user.click(screen.getByRole('button', { name: 'Open buddy chat' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: 'Onboarding buddy' })).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('hello!')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
