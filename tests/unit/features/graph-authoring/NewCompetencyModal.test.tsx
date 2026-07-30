import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NewCompetencyModal } from '../../../../src/features/graph-authoring/components/NewCompetencyModal';

function renderModal(overrides: Partial<Parameters<typeof NewCompetencyModal>[0]> = {}) {
    const onCreate = overrides.onCreate ?? vi.fn().mockResolvedValue(true);
    const onClose = overrides.onClose ?? vi.fn();
    const onClearError = overrides.onClearError ?? vi.fn();
    render(
        <NewCompetencyModal
            existingAreas={[]}
            isSaving={false}
            error={null}
            onClearError={onClearError}
            onCreate={onCreate}
            onClose={onClose}
            {...overrides}
        />
    );
    return { onCreate, onClose, onClearError };
}

describe('NewCompetencyModal', () => {
    it('cannot submit without a name', () => {
        renderModal();
        // No name yet means no key either, so there is nothing to create.
        expect(screen.getByTestId('create-competency')).toBeDisabled();
    });

    it('previews the slug the typed name will become', async () => {
        const user = userEvent.setup();
        renderModal();

        await user.type(screen.getByLabelText('Name'), 'Docker Compose');

        // The PM sees the key they'll get before saving, so the slugification is not a surprise.
        expect(screen.getByText('docker-compose')).toBeInTheDocument();
    });

    it('creates with the derived key when the identifier is left to follow the name', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Name'), 'Docker Compose');
        await user.click(screen.getByTestId('create-competency'));

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ key: 'Docker Compose', label: 'Docker Compose', kind: 'SKILL' })
        );
    });

    it('stops deriving the key once it is edited by hand', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Name'), 'Docker Compose');
        await user.clear(screen.getByLabelText('Identifier'));
        await user.type(screen.getByLabelText('Identifier'), 'containers');
        await user.click(screen.getByTestId('create-competency'));

        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ key: 'containers' }));
    });

    it('closes after a successful create', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal({ onCreate: vi.fn().mockResolvedValue(true) });

        await user.type(screen.getByLabelText('Name'), 'Docker');
        await user.click(screen.getByTestId('create-competency'));

        expect(onClose).toHaveBeenCalled();
    });

    it('stays open when the create fails, so the error is visible', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal({ onCreate: vi.fn().mockResolvedValue(false) });

        await user.type(screen.getByLabelText('Name'), 'Docker');
        await user.click(screen.getByTestId('create-competency'));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders a create error in place', () => {
        renderModal({ error: 'A competency with key docker already exists in the graph' });
        expect(screen.getByTestId('new-competency-error')).toHaveTextContent(/already exists/i);
    });

    it('sends the area so a new competency can be grouped from the start', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal({ existingAreas: ['Authentication'] });

        await user.type(screen.getByLabelText('Name'), 'Session store');
        await user.type(screen.getByLabelText('Area'), 'Authentication');
        await user.click(screen.getByTestId('create-competency'));

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ area: 'Authentication' })
        );
    });

    it('leaves the area out entirely when none is given', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Name'), 'Kotlin');
        await user.click(screen.getByTestId('create-competency'));

        // Ungrouped is a real state, so an empty field must not become an empty-string area.
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ area: undefined })
        );
    });

    it('offers the areas already in use, so a PM lands on the existing spelling', () => {
        renderModal({ existingAreas: ['Authentication', 'Ingestion'] });

        const options = document.querySelectorAll('#new-competency-area-options option');
        expect([...options].map(option => option.getAttribute('value'))).toEqual([
            'Authentication',
            'Ingestion'
        ]);
    });
});
