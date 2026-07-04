import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { SidePanel } from '../../../src/components/ui/SidePanel';

describe('SidePanel Accessibility', () => {
    it('should not have any a11y violations when open', async () => {
        const { baseElement } = render(
            <SidePanel
                isOpen={true}
                title="Example Panel"
                description="This is a description"
                onClose={vi.fn()}
            >
                <div>Side Panel Content</div>
            </SidePanel>
        );
        const results = await axe(baseElement);
        expect(results).toHaveNoViolations();
    });
});
