import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioNodePanel } from '../../../../src/features/graph-authoring/components/StudioNodePanel';
import { useGraphEditing } from '../../../../src/features/graph-authoring/hooks/useGraphEditing';
import { competencyGraphService } from '../../../../src/services/competencyGraphService';
import type { LiveGraph } from '../../../../src/features/graph-authoring/types';

const graph: LiveGraph = {
    competencies: [
        {
            key: 'kotlin',
            label: 'Kotlin',
            description: null,
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false
        },
        {
            key: 'spring',
            label: 'Spring',
            description: 'How we wire the backend',
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false
        }
    ]
};

/**
 * Wires the panel to the real write hook, exactly as the studio page does, so
 * these assertions are about the endpoints actually called rather than about
 * callbacks the test itself supplied.
 */
function Harness({
    nodeKey = 'spring',
    onGraphChanged
}: {
    nodeKey?: string;
    onGraphChanged: () => void;
}) {
    const editing = useGraphEditing(onGraphChanged);
    const competency = graph.competencies.find(candidate => candidate.key === nodeKey)!;

    return (
        <StudioNodePanel
            competency={competency}
            readiness={{ activeModuleId: null, pending: null }}
            canAuthorModules
            isSaving={editing.isSaving}
            editError={editing.error}
            onClearEditError={editing.clearError}
            onSave={input => editing.updateCompetency(competency.key, input)}
            onDelete={() => editing.deleteCompetency(competency.key)}
            onClose={vi.fn()}
            moduleReadinessProps={{
                isBusy: false,
                error: null,
                onOpenModule: vi.fn(),
                onCreate: vi.fn()
            }}
        />
    );
}

function renderPanel(onGraphChanged = vi.fn()) {
    render(<Harness onGraphChanged={onGraphChanged} />);
}

describe('StudioNodePanel', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(competencyGraphService, 'fetchCompetency').mockResolvedValue({
            key: 'spring',
            label: 'Spring',
            description: 'How we wire the backend',
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false
        });
    });

    describe('editing a competency', () => {
        it('seeds the form from the competency record', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));

            await waitFor(() =>
                expect(screen.getByLabelText('Description')).toHaveValue('How we wire the backend')
            );
            expect(screen.getByLabelText('Bar to meet')).toHaveValue('2');
        });

        it('shows the key as fixed and explains why', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));

            const keyField = await screen.findByLabelText(/identifier/i);
            expect(keyField).toBeDisabled();
            expect(keyField).toHaveValue('spring');
            expect(screen.getByText(/earned progress is filed under it/i)).toBeInTheDocument();
        });

        it('sends the edit to the competency endpoint and reloads the list', async () => {
            const user = userEvent.setup();
            const onGraphChanged = vi.fn();
            const update = vi.spyOn(competencyGraphService, 'updateCompetency').mockResolvedValue({
                key: 'spring',
                label: 'Spring Boot',
                description: 'How we wire the backend',
                kind: 'SKILL',
                targetLevel: 2,
                invariant: false
            });
            renderPanel(onGraphChanged);

            await user.click(screen.getByTestId('edit-competency'));
            const labelField = await screen.findByLabelText('Name');
            await user.clear(labelField);
            await user.type(labelField, 'Spring Boot');
            await user.click(screen.getByTestId('save-competency'));

            await waitFor(() =>
                expect(update).toHaveBeenCalledWith(
                    'spring',
                    expect.objectContaining({ label: 'Spring Boot' })
                )
            );
            expect(onGraphChanged).toHaveBeenCalled();
        });

        it('warns before raising the bar, because that un-holds it for people who met the old one', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            const levelField = await screen.findByLabelText('Bar to meet');

            expect(screen.queryByTestId('raise-level-warning')).not.toBeInTheDocument();

            await user.selectOptions(levelField, '4');

            expect(screen.getByTestId('raise-level-warning')).toHaveTextContent(
                /not holding it again/i
            );
        });

        it('does not warn when the bar is lowered', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            await user.selectOptions(await screen.findByLabelText('Bar to meet'), '1');

            expect(screen.queryByTestId('raise-level-warning')).not.toBeInTheDocument();
        });
    });

    describe('deleting a competency', () => {
        it('states what survives the delete before confirming', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            await user.click(await screen.findByTestId('delete-competency'));

            expect(
                screen.getByText(/nobody loses a competency they already earned/i)
            ).toBeInTheDocument();
            // Deletion is real now, so the module surviving it is the part a PM
            // cannot guess and would otherwise assume they were destroying.
            expect(screen.getByText(/module written for it is kept/i)).toBeInTheDocument();
        });

        it('does not call the endpoint until the confirmation is accepted', async () => {
            const user = userEvent.setup();
            const remove = vi
                .spyOn(competencyGraphService, 'deleteCompetency')
                .mockResolvedValue({ key: 'spring' });
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            await user.click(await screen.findByTestId('delete-competency'));
            expect(remove).not.toHaveBeenCalled();

            await user.click(screen.getByTestId('confirm-delete-competency'));
            await waitFor(() => expect(remove).toHaveBeenCalledWith('spring'));
        });
    });

    it('offers no ordering to author, because there is none', () => {
        renderPanel();

        expect(screen.queryByLabelText(/prerequisite/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/unlocks/i)).not.toBeInTheDocument();
    });
});
