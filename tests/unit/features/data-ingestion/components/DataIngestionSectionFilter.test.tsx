import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataIngestionSectionFilter } from '../../../../../src/features/data-ingestion/components/DataIngestionSectionFilter';

function filter() {
    return within(screen.getByRole('group', { name: /filter sections/i }));
}

describe('DataIngestionSectionFilter', () => {
    it('renders all section options with counts', () => {
        render(
            <DataIngestionSectionFilter active="all" onChange={vi.fn()} sourceCount={4} runCount={3} />,
        );

        expect(filter().getByRole('button', { name: /all/i })).toBeInTheDocument();
        expect(filter().getByRole('button', { name: /overview/i })).toBeInTheDocument();
        expect(filter().getByRole('button', { name: /sources/i })).toHaveTextContent('4');
        expect(filter().getByRole('button', { name: /runs/i })).toHaveTextContent('3');
        expect(filter().getByRole('button', { name: /artifacts/i })).toBeInTheDocument();
        expect(filter().getByRole('button', { name: /connectors/i })).toBeInTheDocument();
    });

    it('marks the active section as pressed and highlighted', () => {
        render(
            <DataIngestionSectionFilter active="runs" onChange={vi.fn()} sourceCount={4} runCount={3} />,
        );

        const runsButton = filter().getByRole('button', { name: /runs/i });
        expect(runsButton).toHaveAttribute('aria-pressed', 'true');
        expect(runsButton).toHaveClass('bg-app-brand');
    });

    it('calls onChange with the clicked section', async () => {
        const onChange = vi.fn();
        render(
            <DataIngestionSectionFilter active="all" onChange={onChange} sourceCount={4} runCount={3} />,
        );

        await userEvent.click(filter().getByRole('button', { name: /overview/i }));
        expect(onChange).toHaveBeenCalledWith('overview');
    });
});
