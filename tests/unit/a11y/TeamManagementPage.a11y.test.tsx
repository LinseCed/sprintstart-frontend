import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { TeamManagementPage } from '../../../src/pages/TeamManagementPage';

describe('TeamManagementPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <main><MemoryRouter><TeamManagementPage /></MemoryRouter></main>
        );
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
