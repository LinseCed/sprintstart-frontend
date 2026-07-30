import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ModuleAuthoringSection } from '../../../../src/features/graph-authoring/components/ModuleAuthoringSection';
import type { LiveCompetency } from '../../../../src/features/graph-authoring/types';

const competency: LiveCompetency = {
    key: 'kotlin',
    label: 'Kotlin',
    description: null,
    kind: 'SKILL',
    area: null,
    targetLevel: 2,
    invariant: false
};

function renderSection(overrides: Partial<React.ComponentProps<typeof ModuleAuthoringSection>> = {}) {
    const props = {
        competency,
        readiness: { activeModuleId: null, pending: null },
        isBusy: false,
        error: null,
        onOpenModule: vi.fn(),
        onCreate: vi.fn(),
        ...overrides
    };
    render(<ModuleAuthoringSection {...props} />);
    return props;
}

describe('ModuleAuthoringSection', () => {
    describe('no module yet', () => {
        it('offers both create paths and no edit', () => {
            renderSection();

            expect(screen.getByTestId('author-draft-ai')).toBeInTheDocument();
            expect(screen.getByTestId('author-create-blank')).toBeInTheDocument();
            expect(screen.queryByTestId('author-edit-module')).not.toBeInTheDocument();
            expect(screen.queryByTestId('author-continue-module')).not.toBeInTheDocument();
        });

        it('creates a blank module', async () => {
            const user = userEvent.setup();
            const props = renderSection();

            await user.click(screen.getByTestId('author-create-blank'));

            expect(props.onCreate).toHaveBeenCalledWith('blank');
        });

        it('drafts with AI', async () => {
            const user = userEvent.setup();
            const props = renderSection();

            await user.click(screen.getByTestId('author-draft-ai'));

            expect(props.onCreate).toHaveBeenCalledWith('ai');
        });

        it('disables both while a create is in flight', () => {
            renderSection({ isBusy: true });

            expect(screen.getByTestId('author-draft-ai')).toBeDisabled();
            expect(screen.getByTestId('author-create-blank')).toBeDisabled();
        });
    });

    describe('a draft is in flight', () => {
        it('offers to continue it rather than create a duplicate', async () => {
            const user = userEvent.setup();
            const props = renderSection({
                readiness: { activeModuleId: null, pending: { moduleId: 'm1', status: 'DRAFT' } }
            });

            expect(screen.queryByTestId('author-create-blank')).not.toBeInTheDocument();
            const continueButton = screen.getByTestId('author-continue-module');
            expect(continueButton).toHaveTextContent(/continue the draft/i);

            await user.click(continueButton);
            expect(props.onOpenModule).toHaveBeenCalledWith('m1');
        });

        it('frames a proposed module as awaiting review', () => {
            renderSection({
                readiness: { activeModuleId: null, pending: { moduleId: 'm2', status: 'PROPOSED' } }
            });

            expect(screen.getByTestId('author-continue-module')).toHaveTextContent(/review the proposal/i);
        });
    });

    describe('an active module exists', () => {
        it('offers to edit it', async () => {
            const user = userEvent.setup();
            const props = renderSection({
                readiness: { activeModuleId: 'active-1', pending: null }
            });

            expect(screen.queryByTestId('author-create-blank')).not.toBeInTheDocument();
            await user.click(screen.getByTestId('author-edit-module'));

            expect(props.onOpenModule).toHaveBeenCalledWith('active-1');
        });
    });

    it('surfaces a creation error in place', () => {
        renderSection({ error: 'Could not create a module.' });

        expect(screen.getByTestId('module-authoring-error')).toHaveTextContent('Could not create a module.');
    });
});
