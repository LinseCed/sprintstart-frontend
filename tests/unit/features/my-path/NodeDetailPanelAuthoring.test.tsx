import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeDetailPanel } from '../../../../src/features/my-path/components/NodeDetailPanel';
import { competencyGraphService } from '../../../../src/services/competencyGraphService';
import { competencyModuleService } from '../../../../src/services/competencyModuleService';
import { ApiError } from '../../../../src/services/apiClient';
import type { PathView } from '../../../../src/features/skill-assessment/types';

const permissionGroup = vi.hoisted(() => ({ current: 'PM' }));

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'u1', permissionGroup: permissionGroup.current } })
}));

const path: PathView = {
    graphVersion: 4,
    nodes: [
        { key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 },
        { key: 'spring', label: 'Spring', kind: 'SKILL', state: 'AVAILABLE' },
        { key: 'testing', label: 'Testing', kind: 'SKILL', state: 'LOCKED' }
    ],
    edges: [{ from: 'kotlin', to: 'spring' }]
};

function renderPanel(nodeKey = 'spring', onGraphChanged = vi.fn()) {
    const node = path.nodes.find(candidate => candidate.key === nodeKey)!;
    return render(
        <NodeDetailPanel
            node={node}
            path={path}
            source={null}
            onStartModule={vi.fn()}
            onEditModule={vi.fn()}
            onSelectKey={vi.fn()}
            onClose={vi.fn()}
            onGraphChanged={onGraphChanged}
        />
    );
}

describe('NodeDetailPanel graph authoring', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        permissionGroup.current = 'PM';
        vi.spyOn(competencyModuleService, 'fetchModule').mockResolvedValue({
            pages: []
        } as unknown as Awaited<ReturnType<typeof competencyModuleService.fetchModule>>);
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

    describe('permissions', () => {
        it('offers no authoring affordances to a plain hire', () => {
            permissionGroup.current = 'USER';
            renderPanel();

            expect(screen.queryByTestId('edit-competency')).not.toBeInTheDocument();
            expect(screen.queryByLabelText(/prerequisites for/i)).not.toBeInTheDocument();
        });

        it('offers none to HR either, which reviews proposals but does not author', () => {
            permissionGroup.current = 'HR';
            renderPanel();

            expect(screen.queryByTestId('edit-competency')).not.toBeInTheDocument();
        });

        it('offers them to a PM', () => {
            renderPanel();

            expect(screen.getByTestId('edit-competency')).toBeInTheDocument();
            expect(screen.getByLabelText(/prerequisites for spring/i)).toBeInTheDocument();
        });
    });

    describe('editing a node', () => {
        it('seeds the form from the competency record, not the projected node', async () => {
            const user = userEvent.setup();
            renderPanel();

            await user.click(screen.getByTestId('edit-competency'));

            // `description` and `targetLevel` exist only on the record -- the path
            // does not carry them, so this is what proves the fetch is used.
            await waitFor(() =>
                expect(screen.getByLabelText('Description')).toHaveValue(
                    'How we wire the backend'
                )
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
            const update = vi
                .spyOn(competencyGraphService, 'updateCompetency')
                .mockResolvedValue({
                    key: 'spring',
                    label: 'Spring Boot',
                    description: 'How we wire the backend',
                    kind: 'SKILL',
                    targetLevel: 2,
                    invariant: false,
                    repoRef: null
                });
            renderPanel('spring', onGraphChanged);

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

            expect(
                screen.getByLabelText('Remove Kotlin as a prerequisite')
            ).toBeInTheDocument();
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
});
