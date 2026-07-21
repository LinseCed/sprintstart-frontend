import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AssessmentPathView } from '../../../../../src/features/skill-assessment/components/AssessmentPathView';
import type { PathView } from '../../../../../src/features/skill-assessment/types';

describe('AssessmentPathView', () => {
    it('shows a friendly message when there are no nodes', () => {
        render(<AssessmentPathView path={{ nodes: [], edges: [], graphVersion: 1 }} />);

        expect(screen.getByText(/no competencies in your path yet/i)).toBeInTheDocument();
    });

    it('orders nodes so prerequisites render before what builds on them', () => {
        const path: PathView = {
            nodes: [
                { key: 'b', label: 'B', kind: 'SKILL', state: 'AVAILABLE' },
                { key: 'a', label: 'A', kind: 'SKILL', state: 'MASTERED' },
            ],
            edges: [{ from: 'a', to: 'b' }],
            graphVersion: 1,
        };
        render(<AssessmentPathView path={path} />);

        const labels = screen.getAllByRole('listitem').map(item => item.textContent);
        expect(labels[0]).toContain('A');
        expect(labels[1]).toContain('B');
    });

    it('shows a node\'s direct prerequisites', () => {
        const path: PathView = {
            nodes: [
                { key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED' },
                { key: 'domain-model', label: 'Our domain model', kind: 'CONCEPT', state: 'AVAILABLE' },
            ],
            edges: [{ from: 'kotlin', to: 'domain-model' }],
            graphVersion: 1,
        };
        render(<AssessmentPathView path={path} />);

        expect(screen.getByText(/after: kotlin/i)).toBeInTheDocument();
    });

    it('renders more shown and fewer open nodes for a senior-like path than a junior-like one', () => {
        const seniorPath: PathView = {
            nodes: [
                { key: 'a', label: 'A', kind: 'SKILL', state: 'MASTERED' },
                { key: 'b', label: 'B', kind: 'SKILL', state: 'MASTERED' },
                { key: 'c', label: 'C', kind: 'CONTRIBUTION', state: 'AVAILABLE' },
            ],
            edges: [],
            graphVersion: 1,
        };
        const juniorPath: PathView = {
            nodes: [
                { key: 'a', label: 'A', kind: 'SKILL', state: 'AVAILABLE' },
                { key: 'b', label: 'B', kind: 'SKILL', state: 'AVAILABLE' },
                { key: 'c', label: 'C', kind: 'SKILL', state: 'AVAILABLE' },
                { key: 'd', label: 'D', kind: 'CONCEPT', state: 'AVAILABLE' },
                { key: 'e', label: 'E', kind: 'CONTRIBUTION', state: 'AVAILABLE' },
            ],
            edges: [],
            graphVersion: 1,
        };

        const { unmount } = render(<AssessmentPathView path={seniorPath} />);
        const seniorOpenCount = screen.queryAllByText('Open').length;
        unmount();

        render(<AssessmentPathView path={juniorPath} />);
        const juniorOpenCount = screen.queryAllByText('Open').length;

        expect(seniorOpenCount).toBeLessThan(juniorOpenCount);
    });

    it('opens a node with a stepId and calls onSelectNode', async () => {
        const path: PathView = {
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'AVAILABLE', moduleId: 'step1' }],
            edges: [],
            graphVersion: 1,
        };
        const onSelectNode = vi.fn();
        const user = userEvent.setup();
        render(<AssessmentPathView path={path} onSelectNode={onSelectNode} />);

        await user.click(screen.getByRole('button', { name: /kotlin/i }));

        expect(onSelectNode).toHaveBeenCalledWith(path.nodes[0]);
    });

    it('does not make a node without a stepId clickable', () => {
        const path: PathView = {
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'AVAILABLE' }],
            edges: [],
            graphVersion: 1,
        };
        render(<AssessmentPathView path={path} onSelectNode={vi.fn()} />);

        expect(screen.queryByRole('button', { name: /kotlin/i })).not.toBeInTheDocument();
    });
});
