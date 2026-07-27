import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NewStarterTaskModal } from '../../../../src/features/starter-work/components/NewStarterTaskModal';
import type { OnboardingTrack } from '../../../../src/features/onboarding-setup/types';

const DELIVERY: OnboardingTrack = {
    key: 'delivery',
    label: 'Agile delivery',
    contributionNoun: 'ceremony',
    contributionNounPlural: 'ceremonies',
    contributionVerbPast: 'facilitated',
    evidenceKinds: ['ATTESTATION'],
};

function renderModal(overrides: Partial<Parameters<typeof NewStarterTaskModal>[0]> = {}) {
    const onCreate = overrides.onCreate ?? vi.fn().mockResolvedValue(true);
    const onClose = overrides.onClose ?? vi.fn();
    render(
        <NewStarterTaskModal
            isSaving={false}
            error={null}
            tracks={[DELIVERY]}
            onCreate={onCreate}
            onClose={onClose}
            {...overrides}
        />
    );
    return { onCreate, onClose };
}

describe('NewStarterTaskModal', () => {
    it('cannot submit without a title', () => {
        renderModal();
        expect(screen.getByTestId('create-starter-task')).toBeDisabled();
    });

    it('creates with the title and omits blank optional fields', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Title'), 'Add dark mode');
        await user.click(screen.getByTestId('create-starter-task'));

        expect(onCreate).toHaveBeenCalledWith({
            title: 'Add dark mode',
            summary: undefined,
            sourceUrl: undefined,
            competencyKeys: undefined,
            // "Any role" is the default, and it is sent as absent rather than as a sentinel.
            onboardingTrackKey: undefined
        });
    });

    it('parses comma- or space-separated competency keys into a list', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Title'), 'Add dark mode');
        await user.type(
            screen.getByLabelText(/Prerequisite competencies/i),
            'react,  typescript  css'
        );
        await user.click(screen.getByTestId('create-starter-task'));

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ competencyKeys: ['react', 'typescript', 'css'] })
        );
    });

    it('closes after a successful create', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal({ onCreate: vi.fn().mockResolvedValue(true) });

        await user.type(screen.getByLabelText('Title'), 'Add dark mode');
        await user.click(screen.getByTestId('create-starter-task'));

        expect(onClose).toHaveBeenCalled();
    });

    it('stays open when the create fails', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal({ onCreate: vi.fn().mockResolvedValue(false) });

        await user.type(screen.getByLabelText('Title'), 'Add dark mode');
        await user.click(screen.getByTestId('create-starter-task'));

        expect(onClose).not.toHaveBeenCalled();
    });

    it('scopes the task to a track when the PM picks one', async () => {
        const user = userEvent.setup();
        const { onCreate } = renderModal();

        await user.type(screen.getByLabelText('Title'), 'Run the sprint retro');
        await user.selectOptions(screen.getByLabelText('Who this is for'), 'delivery');
        await user.click(screen.getByTestId('create-starter-task'));

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ onboardingTrackKey: 'delivery' })
        );
    });

    it('defaults to any role rather than preselecting a track', () => {
        renderModal();

        // Scoping hides a task from other roles, so it has to be a deliberate choice rather than
        // something a PM has to remember to undo.
        expect(screen.getByLabelText('Who this is for')).toHaveValue('__any__');
    });
});