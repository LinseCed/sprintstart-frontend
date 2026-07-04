import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Modal } from '../../../src/components/ui/Modal';

describe('Modal Accessibility', () => {
    it('should not have any a11y violations when open', async () => {
        const { baseElement } = render(
            <Modal
                isOpen={true}
                title="Example Modal"
                description="This is a description"
                onClose={vi.fn()}
            >
                <div>Modal Content</div>
            </Modal>
        );
        const results = await axe(baseElement);
        expect(results).toHaveNoViolations();
    });
});
