import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NodeStatusChip } from '../../../../../src/features/skill-assessment/components/NodeStatusChip';

describe('NodeStatusChip', () => {
    it('renders the shown (mastered) state with its label', () => {
        render(<NodeStatusChip state="MASTERED" />);
        expect(screen.getByText('Shown')).toBeInTheDocument();
    });

    it('renders the open (available) state with its label', () => {
        render(<NodeStatusChip state="AVAILABLE" />);
        expect(screen.getByText('Open')).toBeInTheDocument();
    });
});
