import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BaselineSection } from '../../../../src/features/graph-authoring/components/BaselineSection';
import type { BaselineEntry, LiveCompetency } from '../../../../src/features/graph-authoring/types';

const competency: LiveCompetency = {
    key: 'python',
    label: 'Python',
    description: 'The language.',
    kind: 'SKILL',
    targetLevel: 2,
    invariant: false,
    repoRef: null,
};

function expected(overrides: Partial<BaselineEntry> = {}): BaselineEntry {
    return {
        competencyKey: 'python',
        targetLevel: 2,
        targetLevelOverridden: false,
        requirement: 'required',
        invariant: false,
        ...overrides,
    };
}

describe('BaselineSection', () => {
    it('turning "expected" on with no entry sets it with defaults', async () => {
        const onSetExpected = vi.fn();
        render(
            <BaselineSection
                competency={competency}
                entry={null}
                isBusy={false}
                error={null}
                onSetExpected={onSetExpected}
                onRemove={vi.fn()}
            />,
        );
        await userEvent.click(screen.getByRole('checkbox', { name: /expected on this project/i }));
        expect(onSetExpected).toHaveBeenCalledWith({});
    });

    it('turning it off removes the entry', async () => {
        const onRemove = vi.fn();
        render(
            <BaselineSection
                competency={competency}
                entry={expected()}
                isBusy={false}
                error={null}
                onSetExpected={vi.fn()}
                onRemove={onRemove}
            />,
        );
        await userEvent.click(screen.getByRole('checkbox', { name: /expected on this project/i }));
        expect(onRemove).toHaveBeenCalled();
    });

    it('choosing a level sends the override with the current mandate flag', async () => {
        const onSetExpected = vi.fn();
        render(
            <BaselineSection
                competency={competency}
                entry={expected()}
                isBusy={false}
                error={null}
                onSetExpected={onSetExpected}
                onRemove={vi.fn()}
            />,
        );
        await userEvent.selectOptions(screen.getByRole('combobox'), '3');
        expect(onSetExpected).toHaveBeenCalledWith({ targetLevel: 3, invariant: false });
    });

    it('a mandate cannot be un-expected here', () => {
        render(
            <BaselineSection
                competency={competency}
                entry={expected({ invariant: true })}
                isBusy={false}
                error={null}
                onSetExpected={vi.fn()}
                onRemove={vi.fn()}
            />,
        );
        expect(screen.getByRole('checkbox', { name: /expected on this project/i })).toBeDisabled();
        expect(screen.getByText(/clear the mandate first/i)).toBeInTheDocument();
    });
});
