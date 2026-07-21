import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AiActivityLog } from '../../../../src/features/ai-activity/AiActivityLog';
import type { AiActivityEntry } from '../../../../src/features/ai-activity/useAiStream';

const entries: AiActivityEntry[] = [
    { key: 'a', kind: 'stage', label: 'Searching the project: setting up' },
    { key: 'b', kind: 'item', label: 'setting up: Run it locally' },
    { key: 'c', kind: 'warning', label: 'Dropped 1 section with no source' }
];

describe('AiActivityLog', () => {
    it('lists every stage, item and warning line with its title', () => {
        render(<AiActivityLog phase="streaming" entries={entries} title="Assembling your orientation" />);

        expect(screen.getByText('Assembling your orientation')).toBeInTheDocument();
        expect(screen.getByText('Searching the project: setting up')).toBeInTheDocument();
        expect(screen.getByText('setting up: Run it locally')).toBeInTheDocument();
        expect(screen.getByText('Dropped 1 section with no source')).toBeInTheDocument();
    });

    it('shows a getting-started line before anything has landed', () => {
        render(<AiActivityLog phase="streaming" entries={[]} title="Drafting the module" />);

        expect(screen.getByText(/Getting started/)).toBeInTheDocument();
    });

    it('is an assertive-free polite live region so a screen reader hears items land', () => {
        render(<AiActivityLog phase="streaming" entries={entries} title="x" />);

        expect(screen.getByTestId('ai-activity-log')).toHaveAttribute('aria-live', 'polite');
    });
});
