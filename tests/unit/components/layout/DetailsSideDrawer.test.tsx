import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DetailsSideDrawer } from '../../../../src/components/layout/DetailsSideDrawer';

describe('DetailsSideDrawer', () => {
    it('applies open/close classes correctly', () => {
        const { rerender } = render(
            <DetailsSideDrawer
                isOpen={true}
                onClose={vi.fn()}
                title="Drawer Title"
                leading={<span>Leading</span>}
            >
                <p>Drawer Content</p>
            </DetailsSideDrawer>
        );

        expect(screen.getByText('Drawer Title')).toBeInTheDocument();
        expect(screen.getByText('Drawer Title').closest('aside')).toHaveClass('translate-x-0');

        rerender(
            <DetailsSideDrawer
                isOpen={false}
                onClose={vi.fn()}
                title="Drawer Title"
                leading={<span>Leading</span>}
            >
                <p>Drawer Content</p>
            </DetailsSideDrawer>
        );
        expect(screen.getByText('Drawer Title').closest('aside')).toHaveClass('translate-x-full');
    });

    it('fires onClose when the X button is clicked', () => {
        const onCloseMock = vi.fn();
        render(
            <DetailsSideDrawer
                isOpen={true}
                onClose={onCloseMock}
                title="Close Test"
                leading={<span>Leading</span>}
                closeAriaLabel="Close Me"
            >
                <p>Content</p>
            </DetailsSideDrawer>
        );

        const closeButton = screen.getByLabelText('Close Me');
        fireEvent.click(closeButton);
        expect(onCloseMock).toHaveBeenCalledOnce();
    });
});
