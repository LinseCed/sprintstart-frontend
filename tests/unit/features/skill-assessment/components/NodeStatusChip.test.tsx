import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeStatusChip } from '../../../../../src/features/skill-assessment/components/NodeStatusChip';

describe('NodeStatusChip', () => {
    it('renders the mastered state with its label', () => {
        render(<NodeStatusChip state="mastered" />);
        expect(screen.getByText('Mastered')).toBeInTheDocument();
    });

    it('renders the available state with its label', () => {
        render(<NodeStatusChip state="available" />);
        expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('renders the locked state with its label', () => {
        render(<NodeStatusChip state="locked" />);
        expect(screen.getByText('Locked')).toBeInTheDocument();
    });
});
