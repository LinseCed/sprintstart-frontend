import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { KnowledgeBasePage } from '../../../src/pages/KnowledgeBasePage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { firstName: 'Test', username: 'Test', email: 'test@test.com' } })
}));

describe('KnowledgeBasePage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter><KnowledgeBasePage /></MemoryRouter>
        );
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
