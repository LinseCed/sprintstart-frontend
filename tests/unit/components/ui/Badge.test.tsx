import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../../../../src/components/ui/Badge';

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Test Badge</Badge>);
        expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('applies the brand variant by default', () => {
        render(<Badge>Default</Badge>);
        expect(screen.getByText('Default')).toHaveClass('bg-app-brand-soft');
    });

    it('applies the correct classes for the danger variant', () => {
        render(<Badge variant="danger">Danger</Badge>);
        expect(screen.getByText('Danger')).toHaveClass('bg-app-danger-bg');
    });

    it('merges custom classNames', () => {
        render(<Badge className="custom-class">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });
});
