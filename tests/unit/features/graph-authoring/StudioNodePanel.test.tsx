import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudioNodePanel } from '../../../../src/features/graph-authoring/components/StudioNodePanel';
import { useGraphEditing } from '../../../../src/features/graph-authoring/hooks/useGraphEditing';
import { competencyGraphService } from '../../../../src/services/competencyGraphService';
import { ApiError } from '../../../../src/services/apiClient';
import type {
    CompetencyProposal,
    LiveGraph
} from '../../../../src/features/graph-authoring/types';

const graph: LiveGraph = {
    graphVersion: 4,
    competencies: [
        {
            key: 'kotlin',
            label: 'Kotlin',
            description: null,
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false,
            repoRef: null
        },
        {
            key: 'spring',
            label: 'Spring',
            description: 'How we wire the backend',
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false,
            repoRef: null
        },
        {
            key: 'testing',
            label: 'Testing',
            description: null,
            kind: 'SKILL',
            targetLevel: 2,
            invariant: false,
            repoRef: null
        }
    ],
    edges: [{ fromKey: 'kotlin', toKey: 'spring', kind: 'PREREQUISITE' }]
};

/**
 * Wires the panel to the real write hook, exactly as the studio page does, so
 * these assertions are about the endpoints actually called rather than about
 * callbacks the test itself supplied.
 */
function Harness({
    nodeKey = 'spring',
    onGraphChanged,
    proposal = null
}: {
    nodeKey?: string;
    onGraphChanged: () => void;
    proposal?: CompetencyProposal | null;
}) {
    const editing = useGraphEditing(onGraphChanged);
    const competency = proposal
        ? {
              key: proposal.key,
              label: proposal.label,
              description: proposal.description,
              kind: proposal.kind,
              targetLevel: 0,
              invariant: false,
              repoRef: proposal.repoRef
          }
        : graph.competencies.find(candidate => candidate.key === nodeKey)!;

    return (
        <StudioNodePanel
            competency={competency}
            graph={graph}
            proposal={proposal}
            readiness={{ activeModuleId: null, pending: null }}
            canAuthorModules
            isSaving={editing.isSaving}
            editError={editing.error}
            onClearEditError={editing.clearError}
            onSave={input => editing.updateCompetency(competency.key, input)}
            onDelete={() => editing.deleteCompetency(competency.key)}
            onAddPrerequisite={editing.addPrerequisite}
            onRemovePrerequisite={editing.removePrerequisite}
            onSelectKey={vi.fn()}
            onClose={vi.fn()}
            moduleReadinessProps={{
                isBusy: false,
                error: null,
                onOpenModule: vi.fn(),
                onCreate: vi.fn()
            }}
            onApproveProposal={vi.fn()}
            onRejectProposal={vi.fn()}
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
            invariant: false,
            repoRef: null
        });
    });

    describe('editing a node', () => {
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

        it('sends the edit to the competency endpoint and reloads the graph', async () => {
            const user = userEvent.setup();
            const onGraphChanged = vi.fn();
            const update = vi.spyOn(competencyGraphService, 'updateCompetency').mockResolvedValue({
                key: 'spring',
                label: 'Spring Boot',
                description: 'How we wire the backend',
                kind: 'SKILL',
                targetLevel: 2,
                invariant: false,
                repoRef: null
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

        it('warns before raising the bar, because that can un-hold a met node', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            const levelField = await screen.findByLabelText('Bar to meet');

            expect(screen.queryByTestId('raise-level-warning')).not.toBeInTheDocument();

            await user.selectOptions(levelField, '4');

            expect(screen.getByTestId('raise-level-warning')).toHaveTextContent(
                /go back to unfinished/i
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

    describe('deleting a node', () => {
        it('states that earned progress is kept before confirming', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            await user.click(await screen.findByTestId('delete-competency'));

            expect(
                screen.getByText(/nobody loses a competency they already earned/i)
            ).toBeInTheDocument();
            expect(screen.getByText(/add this node back later/i)).toBeInTheDocument();
        });

        it('does not call the endpoint until the confirmation is accepted', async () => {
            const user = userEvent.setup();
            const remove = vi
                .spyOn(competencyGraphService, 'deleteCompetency')
                .mockResolvedValue({ key: 'spring', edgesRemoved: 1, graphVersion: 5 });
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));
            await user.click(await screen.findByTestId('delete-competency'));
            expect(remove).not.toHaveBeenCalled();

            await user.click(screen.getByTestId('confirm-delete-competency'));
            await waitFor(() => expect(remove).toHaveBeenCalledWith('spring'));
        });
    });

    describe('prerequisites', () => {
        it('lists existing prerequisites and offers the rest as candidates', () => {
            renderPanel();

            expect(screen.getByLabelText('Remove Kotlin as a prerequisite')).toBeInTheDocument();
            // Kotlin is already linked and Spring is the node itself, so only
            // Testing is offerable.
            const select = screen.getByLabelText(/add a prerequisite for spring/i);
            expect(select).toHaveTextContent('Testing');
            expect(select).not.toHaveTextContent('Kotlin');
        });

        it('surfaces a rejected cycle in place, with the message the backend gave', async () => {
            const user = userEvent.setup();
            vi.spyOn(competencyGraphService, 'createEdge').mockRejectedValue(
                new ApiError(
                    400,
                    'A prerequisite edge from spring to testing would create a cycle: spring already requires testing, directly or indirectly'
                )
            );
            renderPanel();

            await user.selectOptions(
                screen.getByLabelText(/add a prerequisite for spring/i),
                'testing'
            );
            await user.click(screen.getByTestId('add-prerequisite'));

            const error = await screen.findByTestId('prerequisite-error');
            // The backend names both ends; replacing that with a generic message
            // would throw away the only part a PM can act on.
            expect(error).toHaveTextContent(/would create a cycle/i);
            expect(error).toHaveTextContent(/spring already requires testing/i);
        });

        it('removes a prerequisite through the edge endpoint', async () => {
            const user = userEvent.setup();
            const removeEdge = vi
                .spyOn(competencyGraphService, 'deleteEdge')
                .mockResolvedValue({ fromKey: 'kotlin', toKey: 'spring', kind: 'PREREQUISITE' });
            renderPanel();

            await user.click(screen.getByLabelText('Remove Kotlin as a prerequisite'));

            await waitFor(() =>
                expect(removeEdge).toHaveBeenCalledWith('kotlin', 'spring', 'PREREQUISITE')
            );
        });

        it('says prerequisite changes are not immediate for hires', () => {
            renderPanel();

            expect(screen.getByText(/at their next session/i)).toBeInTheDocument();
        });
    });

    describe('a selected proposal', () => {
        const proposal: CompetencyProposal = {
            id: 'p1',
            key: 'jpa-persistence',
            label: 'JPA persistence',
            description: 'How entities are mapped here',
            kind: 'CONCEPT',
            repoRef: null,
            status: 'PROPOSED'
        };

        it('offers approve and reject instead of an editor', () => {
            render(<Harness onGraphChanged={vi.fn()} proposal={proposal} />);

            expect(screen.getByTestId('studio-approve-proposal')).toBeInTheDocument();
            expect(screen.getByTestId('studio-reject-proposal')).toBeInTheDocument();
            // There is no live row to edit yet, so editing it would have nothing
            // to write to.
            expect(screen.queryByTestId('edit-competency')).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/add a prerequisite/i)).not.toBeInTheDocument();
        });
    });
});
